/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Energy Transfer and Transaction Management
File          : ReservationSnapshot.cs
Description   : Read-only projection of a Component 3 reservation
                document. This component never owns the reservation
                schema, so it maps the raw BSON into this local shape
                instead of redeclaring the EnergyReservation entity.
Author        : Malmi
=====================================================
*/

namespace backend.Models;

/// <summary>
/// The subset of an <c>EnergyReservations</c> document that the energy
/// transfer workflow needs.
/// <para>
/// Reservations belong to Component 3 (Reservation Management). Declaring a
/// second entity class for the same collection would duplicate ownership of
/// that schema, so this component reads the documents defensively and
/// projects them here. Anything Component 3 adds later is simply ignored.
/// </para>
/// </summary>
public class ReservationSnapshot
{
    /// <summary>MongoDB document id of the reservation.</summary>
    public string? Id { get; set; }

    /// <summary>Business key of the reservation, e.g. <c>RES-20260918-AB12CD</c>.</summary>
    public string ReservationId { get; set; } = string.Empty;

    /// <summary>Station the energy is collected from.</summary>
    public string StationId { get; set; } = string.Empty;

    /// <summary>Booking slot reserved by the prosumer.</summary>
    public string SlotId { get; set; } = string.Empty;

    /// <summary>Owning account's username, used when the NIC is absent.</summary>
    public string? UserId { get; set; }

    /// <summary>NIC of the prosumer who owns the booking.</summary>
    public string? ProsumerNic { get; set; }

    /// <summary>Prosumer display name.</summary>
    public string? ProsumerName { get; set; }

    /// <summary>Date of the booked slot.</summary>
    public DateTime SlotDate { get; set; }

    /// <summary>Start of the booked slot.</summary>
    public TimeSpan StartTime { get; set; }

    /// <summary>End of the booked slot.</summary>
    public TimeSpan EndTime { get; set; }

    /// <summary>Energy reserved, in kWh.</summary>
    public double ReservedCapacity { get; set; }

    /// <summary>Reservation status as written by Component 3 (e.g. "Confirmed").</summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>When the reservation was placed.</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>True when this reservation is in a state that allows an energy transfer.</summary>
    public bool IsApproved => ReservationStatus.IsApproved(Status);
}
