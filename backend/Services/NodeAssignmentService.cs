/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Microgrid Node Assignment Management
File          : NodeAssignmentService.cs
Description   : Service implementing operator-to-node
                assignment business logic with MongoDB persistence
=====================================================
*/

using backend.Data;
using backend.DTOs.NodeAssignment;
using backend.Interfaces;
using backend.Middleware;
using backend.Models;
using backend.Repositories;
using MongoDB.Bson;
using MongoDB.Driver;

namespace backend.Services;

public class NodeAssignmentService : INodeAssignmentService
{
    private readonly IMongoCollection<SolarStationInfo> _stations;
    private readonly IUserRepository _userRepository;

    public NodeAssignmentService(MongoDbContext context, IUserRepository userRepository)
    {
        _stations = context.Database.GetCollection<SolarStationInfo>("SolarStationInfo");
        _userRepository = userRepository;
    }

    /// <summary>
    /// Helper to find a station by StationId or MongoDB ObjectId.
    /// </summary>
    private async Task<SolarStationInfo?> FindStationAsync(string nodeId)
    {
        var station = await _stations
            .Find(x => x.StationId == nodeId)
            .FirstOrDefaultAsync();

        if (station == null && ObjectId.TryParse(nodeId, out _))
        {
            station = await _stations
                .Find(x => x.Id == nodeId)
                .FirstOrDefaultAsync();
        }

        return station;
    }

    /// <summary>
    /// Helper to find an operator by username or ID.
    /// </summary>
    private async Task<UserDetails?> FindOperatorAsync(string operatorId)
    {
        if (string.IsNullOrWhiteSpace(operatorId))
        {
            return null;
        }

        // Try lookup by username first (e.g., "chamithu")
        var user = await _userRepository.GetByUsernameAsync(operatorId);

        // If not found by username, try by ID
        if (user == null)
        {
            user = await _userRepository.GetByIdAsync(operatorId);
        }

        return user;
    }

    /// <inheritdoc />
    public async Task<SolarStationInfo> AssignOperatorAsync(string nodeId, string operatorId)
    {
        if (string.IsNullOrWhiteSpace(operatorId))
        {
            throw new BadRequestException("OPERATOR_REQUIRED", "Operator ID is required for assignment.");
        }

        var station = await FindStationAsync(nodeId);
        if (station == null)
        {
            throw new NotFoundException("NODE_NOT_FOUND", $"Microgrid node with ID '{nodeId}' was not found.");
        }

        var operatorUser = await FindOperatorAsync(operatorId);
        if (operatorUser == null)
        {
            throw new NotFoundException("OPERATOR_NOT_FOUND", $"Grid Operator with ID '{operatorId}' was not found.");
        }

        if (operatorUser.Role != UserRole.GridOperator)
        {
            throw new BadRequestException("INVALID_ROLE", "Only users with the GridOperator role can be assigned to a microgrid node.");
        }

        if (operatorUser.Status != AccountStatus.Active)
        {
            throw new BadRequestException("OPERATOR_NOT_ACTIVE", "Cannot assign an operator whose account is not Active.");
        }

        station.AssignedOperatorId = operatorUser.Id;
        station.AssignedOperatorName = operatorUser.FullName;
        station.AssignedDate = DateTime.UtcNow;
        station.AssignmentStatus = "Assigned";

        var filter = !string.IsNullOrEmpty(station.Id)
            ? Builders<SolarStationInfo>.Filter.Eq(x => x.Id, station.Id)
            : Builders<SolarStationInfo>.Filter.Eq(x => x.StationId, station.StationId);

        await _stations.ReplaceOneAsync(filter, station);

        return station;
    }

    /// <inheritdoc />
    public async Task<SolarStationInfo> RemoveOperatorAssignmentAsync(string nodeId)
    {
        var station = await FindStationAsync(nodeId);
        if (station == null)
        {
            throw new NotFoundException("NODE_NOT_FOUND", $"Microgrid node with ID '{nodeId}' was not found.");
        }

        station.AssignedOperatorId = null;
        station.AssignedOperatorName = null;
        station.AssignedDate = null;
        station.AssignmentStatus = "Unassigned";

        var filter = !string.IsNullOrEmpty(station.Id)
            ? Builders<SolarStationInfo>.Filter.Eq(x => x.Id, station.Id)
            : Builders<SolarStationInfo>.Filter.Eq(x => x.StationId, station.StationId);

        await _stations.ReplaceOneAsync(filter, station);

        return station;
    }

    /// <inheritdoc />
    public async Task<List<SolarStationInfo>> GetNodesByOperatorAsync(string operatorId)
    {
        if (string.IsNullOrWhiteSpace(operatorId))
        {
            return new List<SolarStationInfo>();
        }

        var operatorUser = await FindOperatorAsync(operatorId);
        var targetId = operatorUser?.Id ?? operatorId;
        var targetUsername = operatorUser?.Username ?? operatorId;

        var filter = Builders<SolarStationInfo>.Filter.And(
            Builders<SolarStationInfo>.Filter.Or(
                Builders<SolarStationInfo>.Filter.Eq(x => x.AssignedOperatorId, targetId),
                Builders<SolarStationInfo>.Filter.Eq(x => x.AssignedOperatorId, targetUsername)
            ),
            Builders<SolarStationInfo>.Filter.Eq(x => x.AssignmentStatus, "Assigned")
        );

        return await _stations.Find(filter).ToListAsync();
    }

    /// <inheritdoc />
    public async Task<NodeOperatorResponseDto> GetOperatorByNodeAsync(string nodeId)
    {
        var station = await FindStationAsync(nodeId);
        if (station == null)
        {
            throw new NotFoundException("NODE_NOT_FOUND", $"Microgrid node with ID '{nodeId}' was not found.");
        }

        var response = new NodeOperatorResponseDto
        {
            NodeId = station.StationId ?? station.Id ?? nodeId,
            NodeName = station.StationName,
            AssignedOperatorId = station.AssignedOperatorId,
            AssignedOperatorName = station.AssignedOperatorName,
            AssignedDate = station.AssignedDate,
            AssignmentStatus = station.AssignmentStatus ?? "Unassigned"
        };

        if (!string.IsNullOrEmpty(station.AssignedOperatorId))
        {
            var opUser = await FindOperatorAsync(station.AssignedOperatorId);
            if (opUser != null)
            {
                response.AssignedOperatorEmail = opUser.Email;
                response.AssignedOperatorPhone = opUser.PhoneNumber;
            }
        }

        return response;
    }
}
