/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Microgrid Node Assignment Management
File          : NodeAssignmentController.cs
Description   : REST API endpoints for assigning Grid Operators to
                Microgrid Nodes and querying assignments
=====================================================
*/

using System.Security.Claims;
using backend.DTOs.NodeAssignment;
using backend.Interfaces;
using backend.Middleware;
using backend.Models;
using backend.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Authorize]
public class NodeAssignmentController : ControllerBase
{
    private readonly INodeAssignmentService _assignmentService;
    private readonly IUserRepository _userRepository;

    public NodeAssignmentController(INodeAssignmentService assignmentService, IUserRepository userRepository)
    {
        _assignmentService = assignmentService;
        _userRepository = userRepository;
    }

    /// <summary>
    /// Assigns a Grid Operator to a microgrid node.
    /// Restricted to Backoffice users only.
    /// </summary>
    [HttpPost("api/nodes/{nodeId}/assign-operator")]
    [HttpPost("api/stations/{nodeId}/assign-operator")]
    [Authorize(Roles = "Backoffice")]
    public async Task<IActionResult> AssignOperator(
        [FromRoute] string nodeId,
        [FromBody] AssignOperatorRequestDto request)
    {
        var result = await _assignmentService.AssignOperatorAsync(nodeId, request.OperatorId);
        return Ok(result);
    }

    /// <summary>
    /// Removes the assigned operator from a microgrid node.
    /// Restricted to Backoffice users only.
    /// </summary>
    [HttpDelete("api/nodes/{nodeId}/remove-operator")]
    [HttpDelete("api/stations/{nodeId}/remove-operator")]
    [Authorize(Roles = "Backoffice")]
    public async Task<IActionResult> RemoveOperator([FromRoute] string nodeId)
    {
        var result = await _assignmentService.RemoveOperatorAssignmentAsync(nodeId);
        return Ok(result);
    }

    /// <summary>
    /// Retrieves all microgrid nodes assigned to a specific Grid Operator.
    /// Accessible by Backoffice officers and the assigned Grid Operator themselves.
    /// </summary>
    [HttpGet("api/operators/{operatorId}/nodes")]
    [Authorize(Roles = "Backoffice,GridOperator")]
    public async Task<IActionResult> GetNodesByOperator([FromRoute] string operatorId)
    {
        // Grid Operators can only access their own assigned nodes
        if (User.IsInRole("GridOperator"))
        {
            var currentUsername = User.Identity?.Name;
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("id")?.Value
                ?? User.FindFirst("sub")?.Value;

            // Check if operatorId matches either their username or ID
            var isOwnAccount = string.Equals(operatorId, currentUsername, StringComparison.OrdinalIgnoreCase)
                || (currentUserId != null && string.Equals(operatorId, currentUserId, StringComparison.OrdinalIgnoreCase));

            if (!isOwnAccount && !string.IsNullOrEmpty(currentUsername))
            {
                var currentUser = await _userRepository.GetByUsernameAsync(currentUsername);
                if (currentUser != null && string.Equals(operatorId, currentUser.Id, StringComparison.OrdinalIgnoreCase))
                {
                    isOwnAccount = true;
                }
            }

            if (!isOwnAccount)
            {
                throw new ForbiddenException("FORBIDDEN_OPERATOR_ACCESS", "Grid Operators can only access microgrid nodes assigned to themselves.");
            }
        }

        var result = await _assignmentService.GetNodesByOperatorAsync(operatorId);
        return Ok(result);
    }

    /// <summary>
    /// Retrieves the assigned operator details for a specific microgrid node.
    /// </summary>
    [HttpGet("api/nodes/{nodeId}/operator")]
    [HttpGet("api/stations/{nodeId}/operator")]
    [Authorize(Roles = "Backoffice,GridOperator")]
    public async Task<IActionResult> GetOperatorByNode([FromRoute] string nodeId)
    {
        var result = await _assignmentService.GetOperatorByNodeAsync(nodeId);
        return Ok(result);
    }
}
