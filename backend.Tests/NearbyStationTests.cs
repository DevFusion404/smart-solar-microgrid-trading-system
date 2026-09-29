// ===============================================
// SE4040 - Enterprise Application Development
// Smart Solar Microgrid Trading System
// File: NearbyStationTests.cs
// Description: Unit tests for nearest-station finding: Haversine distance, ranking
//              (nearest first, radius, limit, unset coordinates) and home-location
//              validation on registration and profile update.
// ===============================================

using backend.DTOs.Profile;
using backend.Helpers;
using backend.Middleware;
using backend.Models;
using backend.Services;
using backend.Services.Implementations;
using backend.Tests.Fakes;
using Microsoft.AspNetCore.Identity;
using Xunit;

namespace backend.Tests;

public class NearbyStationTests
{
    // Real Sri Lankan reference points (approximate)
    private const double ColomboLat = 6.9271, ColomboLng = 79.8612;
    private const double KandyLat = 7.2906, KandyLng = 80.6337;
    private const double GalleLat = 6.0535, GalleLng = 80.2210;
    private const double NegomboLat = 7.2008, NegomboLng = 79.8737;

    // Builds an active station at the given point
    private static SolarStationInfo Station(string id, string name, double lat, double lng, string status = "Active") => new()
    {
        Id = Guid.NewGuid().ToString("N"),
        StationId = id,
        StationName = name,
        Address = name,
        Latitude = lat,
        Longitude = lng,
        EnergyCapacity = 100,
        BatteryStorageCapacity = 50,
        OperationalSchedule = "06:00-18:00",
        Status = status
    };

    // Distance between the same point is zero; Colombo to Kandy is about 94 km in a straight line
    [Fact]
    public void Haversine_KnownDistances()
    {
        Assert.Equal(0, GeoDistance.HaversineKm(ColomboLat, ColomboLng, ColomboLat, ColomboLng), 6);

        var colomboKandy = GeoDistance.HaversineKm(ColomboLat, ColomboLng, KandyLat, KandyLng);
        Assert.InRange(colomboKandy, 90, 98);

        // Distance is the same in both directions
        Assert.Equal(colomboKandy, GeoDistance.HaversineKm(KandyLat, KandyLng, ColomboLat, ColomboLng), 6);
    }

    // Coordinate range checks
    [Theory]
    [InlineData(6.9, 79.8, true)]
    [InlineData(90, 180, true)]
    [InlineData(-90, -180, true)]
    [InlineData(91, 79.8, false)]
    [InlineData(6.9, 181, false)]
    [InlineData(double.NaN, 79.8, false)]
    public void IsValidCoordinate(double lat, double lng, bool expected)
    {
        Assert.Equal(expected, GeoDistance.IsValidCoordinate(lat, lng));
    }

    // From Colombo the order must be Colombo node, Negombo, Kandy, Galle... by real distance
    [Fact]
    public void RankByDistance_SortsNearestFirstWithDistance()
    {
        var stations = new[]
        {
            Station("ST-KDY", "Kandy Node", KandyLat, KandyLng),
            Station("ST-GAL", "Galle Node", GalleLat, GalleLng),
            Station("ST-CMB", "Colombo Node", ColomboLat + 0.01, ColomboLng),
            Station("ST-NEG", "Negombo Node", NegomboLat, NegomboLng),
        };

        var ranked = MicrogridStationService.RankByDistance(stations, ColomboLat, ColomboLng, null, null);

        Assert.Equal(new[] { "ST-CMB", "ST-NEG", "ST-KDY", "ST-GAL" }, ranked.Select(r => r.StationId));
        Assert.True(ranked[0].DistanceKm < 2);
        Assert.True(ranked.Zip(ranked.Skip(1)).All(p => p.First.DistanceKm <= p.Second.DistanceKm));
    }

    // Radius keeps only stations inside it; limit caps the number returned
    [Fact]
    public void RankByDistance_AppliesRadiusAndLimit()
    {
        var stations = new[]
        {
            Station("ST-CMB", "Colombo Node", ColomboLat + 0.01, ColomboLng),
            Station("ST-NEG", "Negombo Node", NegomboLat, NegomboLng),
            Station("ST-KDY", "Kandy Node", KandyLat, KandyLng),
        };

        var within50 = MicrogridStationService.RankByDistance(stations, ColomboLat, ColomboLng, 50, null);
        Assert.Equal(new[] { "ST-CMB", "ST-NEG" }, within50.Select(r => r.StationId));

        var nearestOnly = MicrogridStationService.RankByDistance(stations, ColomboLat, ColomboLng, null, 1);
        Assert.Single(nearestOnly);
        Assert.Equal("ST-CMB", nearestOnly[0].StationId);
    }

    // Stations saved without coordinates (0,0) are left out instead of being listed as "far away"
    [Fact]
    public void RankByDistance_SkipsStationsWithoutCoordinates()
    {
        var stations = new[]
        {
            Station("ST-NONE", "No GPS Node", 0, 0),
            Station("ST-KDY", "Kandy Node", KandyLat, KandyLng),
        };

        var ranked = MicrogridStationService.RankByDistance(stations, ColomboLat, ColomboLng, null, null);

        Assert.Equal(new[] { "ST-KDY" }, ranked.Select(r => r.StationId));
    }

    // Home location is optional at registration, but must be complete and valid when sent
    [Fact]
    public async Task Register_HomeLocation_Validation()
    {
        var service = new ProsumerService(new InMemoryUserRepository(), new PasswordHasher<UserDetails>());

        var noLocation = await service.RegisterProsumerAsync(TestData.ValidRegistration(nic: "901234567V", username: "no_loc", email: "noloc@example.com"));
        Assert.Null(noLocation.HomeLatitude);

        var withLocation = TestData.ValidRegistration(nic: "901234568V", username: "with_loc", email: "withloc@example.com");
        withLocation.HomeLatitude = ColomboLat;
        withLocation.HomeLongitude = ColomboLng;
        var saved = await service.RegisterProsumerAsync(withLocation);
        Assert.Equal(ColomboLat, saved.HomeLatitude);
        Assert.Equal(ColomboLng, saved.HomeLongitude);

        var halfLocation = TestData.ValidRegistration(nic: "901234569V", username: "half_loc", email: "half@example.com");
        halfLocation.HomeLatitude = ColomboLat;
        var ex = await Assert.ThrowsAsync<BadRequestException>(() => service.RegisterProsumerAsync(halfLocation));
        Assert.True(ex.ValidationErrors!.ContainsKey("homeLocation"));

        var badLocation = TestData.ValidRegistration(nic: "901234570V", username: "bad_loc", email: "bad@example.com");
        badLocation.HomeLatitude = 123;
        badLocation.HomeLongitude = ColomboLng;
        await Assert.ThrowsAsync<BadRequestException>(() => service.RegisterProsumerAsync(badLocation));
    }

    // A prosumer can set a home location from the profile; web users cannot
    [Fact]
    public async Task UpdateProfile_HomeLocation()
    {
        var repo = new InMemoryUserRepository();
        var hasher = new PasswordHasher<UserDetails>();
        repo.Users.Add(TestData.User(hasher, "p1", UserRole.Prosumer, AccountStatus.Active, "901234567V"));
        repo.Users.Add(TestData.User(hasher, "op1", UserRole.GridOperator, AccountStatus.Active));
        var service = new ProfileService(repo, hasher);

        var updated = await service.UpdateProfileAsync("p1", new UpdateProfileDto { HomeLatitude = KandyLat, HomeLongitude = KandyLng });
        Assert.Equal(KandyLat, updated.HomeLatitude);
        Assert.Equal(KandyLng, updated.HomeLongitude);

        await Assert.ThrowsAsync<BadRequestException>(() =>
            service.UpdateProfileAsync("p1", new UpdateProfileDto { HomeLatitude = KandyLat }));

        await Assert.ThrowsAsync<BadRequestException>(() =>
            service.UpdateProfileAsync("op1", new UpdateProfileDto { HomeLatitude = KandyLat, HomeLongitude = KandyLng }));
    }
}
