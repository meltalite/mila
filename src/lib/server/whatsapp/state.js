/**
 * WhatsApp Client State Management
 * Shared state for QR code and connection status
 */

let currentQR = null;
let connectionStatus = 'initializing'; // initializing, qr_ready, authenticated, connected, disconnected

/**
 * Set current QR code
 * @param {string} qr - QR code data URL
 */
export function setQR(qr) {
	currentQR = qr;
	console.log('[WhatsApp State] QR code updated');
}

/**
 * Get current QR code
 * @returns {string|null}
 */
export function getQR() {
	return currentQR;
}

/**
 * Clear QR code
 */
export function clearQR() {
	currentQR = null;
}

/**
 * Set connection status
 * @param {string} status - New status
 */
export function setStatus(status) {
	connectionStatus = status;
	console.log(`[WhatsApp State] Status: ${status}`);
}

/**
 * Get connection status
 * @returns {string}
 */
export function getStatus() {
	return connectionStatus;
}
