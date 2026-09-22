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

  async getBackofficeReservationQr(reservationId) {
    try {
      const response = await apiClient.get(
        `/backoffice/reservations/${encodeURIComponent(reservationId)}/qr`,
        { responseType: 'blob' },
      )
      return response.data
    } catch (error) {
      const responseData = error.response?.data
      if (responseData instanceof Blob) {
        const text = await responseData.text()
        let responseMessage = ''
        try {
          const response = JSON.parse(text)
          responseMessage = response.message || response.title || ''
        } catch {}
        throw new Error(responseMessage || error.message)
      }
      throw error
    }
  },
}

export default reservationService
