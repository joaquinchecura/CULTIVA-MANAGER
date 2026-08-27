// lib/parseDevice.ts
import { UAParser } from 'ua-parser-js'

export function parseDeviceInfo(userAgent: string | null) {
  if (!userAgent) {
    return { deviceBrand: null, deviceModel: null, deviceOS: null }
  }
  const parser = new UAParser(userAgent)
  const device = parser.getDevice()
  const os = parser.getOS()

  return {
    deviceBrand: device.vendor || null,
    deviceModel: device.model || null,
    deviceOS: os.name && os.version ? `${os.name} ${os.version}` : os.name || null,
  }
}