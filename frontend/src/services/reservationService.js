import apiClient from '../config/api'

const reservationService = {
  async listBackofficeReservations() {
    const response = await apiClient.get('/backoffice/reservations')
    return response.data
  },

  async updateBackofficeReservationStatus(reservationId, status) {
    const response = await apiClient.patch(
      `/backoffice/reservations/${encodeURIComponent(reservationId)}/status`,
      { status },
    )
    return response.data
  },
}

export default reservationService
