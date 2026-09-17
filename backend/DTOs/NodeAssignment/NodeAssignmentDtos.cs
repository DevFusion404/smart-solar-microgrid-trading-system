/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Microgrid Node Assignment Management
File          : NodeAssignmentDtos.cs
Description   : Data transfer objects for operator node assignments
=====================================================
*/

using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.NodeAssignment;

/// <summary>
/// Request DTO for assigning a Grid Operator to a microgrid node.
/// </summary>
public class AssignOperatorRequestDto
{
    /// <summary>
    /// The unique identifier or username of the Grid Operator.
    /// </summary>
    [Required(ErrorMessage = "Operator ID is required.")]
    public string OperatorId { get; set; } = string.Empty;

    /// <summary>
    /// Optional operator display name.
    /// </summary>
    public string? OperatorName { get; set; }
}

/// <summary>
/// Response DTO containing operator assignment details for a microgrid node.
/// </summary>
public class NodeOperatorResponseDto
{
    public string NodeId { get; set; } = string.Empty;
    public string NodeName { get; set; } = string.Empty;
    public string? AssignedOperatorId { get; set; }
    public string? AssignedOperatorName { get; set; }
    public string? AssignedOperatorEmail { get; set; }
    public string? AssignedOperatorPhone { get; set; }
    public DateTime? AssignedDate { get; set; }
    public string AssignmentStatus { get; set; } = "Unassigned";
}
