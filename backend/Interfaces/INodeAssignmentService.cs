/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Microgrid Node Assignment Management
File          : INodeAssignmentService.cs
Description   : Service interface defining contracts for
                operator-to-node assignments
=====================================================
*/

using backend.DTOs.NodeAssignment;
using backend.Models;

namespace backend.Interfaces;

public interface INodeAssignmentService
{
    /// <summary>
    /// Assigns a Grid Operator to a microgrid node.
    /// </summary>
    Task<SolarStationInfo> AssignOperatorAsync(string nodeId, string operatorId);

    /// <summary>
    /// Removes the current operator assignment from a microgrid node.
    /// </summary>
    Task<SolarStationInfo> RemoveOperatorAssignmentAsync(string nodeId);

    /// <summary>
    /// Retrieves all microgrid nodes currently assigned to a specific Grid Operator.
    /// </summary>
    Task<List<SolarStationInfo>> GetNodesByOperatorAsync(string operatorId);

    /// <summary>
    /// Retrieves assigned operator details for a specific microgrid node.
    /// </summary>
    Task<NodeOperatorResponseDto> GetOperatorByNodeAsync(string nodeId);
}
