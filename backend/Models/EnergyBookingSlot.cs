/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Microgrid Node and Energy Slot Management
File          : EnergyBookingSlot.cs
Description   : Stores available energy slots
Author        : Sithmaka
=====================================================
*/


using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;


namespace backend.Models;

public class EnergyBookingSlot
{

    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id {get;set;}

    // Unique slot identifier
    public string SlotId {get;set;}

    // Related microgrid station
    public string StationId {get;set;}

    // Available booking date
    public DateTime Date {get;set;}

    // Slot starting time
    public TimeSpan StartTime {get;set;}

    // Slot ending time
    public TimeSpan EndTime {get;set;}

    // Maximum capacity of this slot
    public double TotalCapacity {get;set;}

    // Remaining available capacity
    public double AvailableCapacity {get;set;}

    // Available / Closed status
    public string Status {get;set;}

}