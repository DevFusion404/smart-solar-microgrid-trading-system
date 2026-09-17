/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Microgrid Node and Energy Slot Management
File          : SolarStationInfo.cs
Description   : Stores solar microgrid node information
Author        : Sithmaka
=====================================================
*/


using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;


namespace backend.Models;

public class SolarStationInfo
{

    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    // Unique identifier of the solar station
    public string StationId { get; set; }

    // Name of the microgrid station
    public string StationName { get; set; }

    // Physical address of the station
    public string Address { get; set; }

    // GPS latitude value used for map integration
    public double Latitude { get; set; }

    // GPS longitude value used for map integration
    public double Longitude { get; set; }

    // Maximum energy generation capacity
    public double EnergyCapacity { get; set; }

    // Battery storage capacity of station
    public double BatteryStorageCapacity { get; set; }

    // Operational working schedule
    public string OperationalSchedule { get; set; }

    // Active or Deactivated
    public string Status { get; set; }

    // Assigned Grid Operator identifier
    [BsonElement("AssignedOperatorId")]
    [BsonIgnoreIfNull]
    public string? AssignedOperatorId { get; set; }

    // Assigned Grid Operator full name
    [BsonElement("AssignedOperatorName")]
    [BsonIgnoreIfNull]
    public string? AssignedOperatorName { get; set; }

    // Date when the operator was assigned
    [BsonElement("AssignedDate")]
    [BsonIgnoreIfNull]
    public DateTime? AssignedDate { get; set; }

    // Assignment status: "Assigned" or "Unassigned"
    [BsonElement("AssignmentStatus")]
    public string AssignmentStatus { get; set; } = "Unassigned";

}