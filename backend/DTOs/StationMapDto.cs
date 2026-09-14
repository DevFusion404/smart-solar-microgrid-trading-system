/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Microgrid Node and Energy Slot Management
File          : StationMapDto.cs
Description   : Lightweight response object returned by
                GET /api/stations/map for Google Maps pins
Author        : Sithmaka
=====================================================
*/


namespace backend.DTOs;

public class StationMapDto
{
    // MongoDB document identifier of the station
    public string Id { get; set; }

    // Display name shown on the map pin
    public string Name { get; set; }

    // GPS latitude for map pin placement
    public double Lat { get; set; }

    // GPS longitude for map pin placement
    public double Lng { get; set; }
}
