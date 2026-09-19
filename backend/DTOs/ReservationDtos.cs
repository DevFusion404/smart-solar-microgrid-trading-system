using System.ComponentModel.DataAnnotations;

namespace backend.DTOs;

public class CreateReservationDto
{
    /// <summary>Business SlotId or MongoDB document id of the selected slot.</summary>
    [Required]
    public string SlotId { get; set; } = string.Empty;

    /// <summary>Requested energy in kWh.</summary>
    [Range(typeof(double), "0.01", "1000000")]
    public double RequestedCapacity { get; set; }
}

public class UpdateReservationDto
{
    /// <summary>Replacement energy amount in kWh.</summary>
    [Range(typeof(double), "0.01", "1000000")]
    public double RequestedCapacity { get; set; }
}
