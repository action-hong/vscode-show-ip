import os from 'os'
import type { ExtensionContext, StatusBarItem } from 'vscode'
import { StatusBarAlignment, window } from 'vscode'

export function activate(context: ExtensionContext) {
  const statusBarItem = new IPAddressStatusBarItem()
  context.subscriptions.push(statusBarItem)
}

const KEY = 'WLAN'

class IPAddressStatusBarItem {
  private _statusBarItem: StatusBarItem
  private _refreshInterval: NodeJS.Timeout
  private _networkInterfaces?: os.NetworkInterfaceInfo[]

  constructor() {
    this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right)
    this._statusBarItem.show()

    this.refresh()

    this._refreshInterval = setInterval(() => this.refresh(), 60 * 1000)
  }

  dispose() {
    this._statusBarItem.dispose()
    clearInterval(this._refreshInterval)
  }

  refresh() {
    this.fetchNetworkInterfaces()
    this.refreshUI()
  }

  getNetworkInterfaces() {
    const networkInterfaces = os.networkInterfaces()

    return networkInterfaces[KEY] || networkInterfaces[Object.keys(networkInterfaces)[0]]
  }

  fetchNetworkInterfaces() {
    this._networkInterfaces = this.getNetworkInterfaces()
  }

  refreshUI() {
    if (!this._networkInterfaces) return

    const ip4 = this._networkInterfaces.find(item => item.family === 'IPv4')
    const ip6 = this._networkInterfaces.find(item => item.family === 'IPv6')

    if (!ip4) return

    const bar = this._statusBarItem

    const arr = [
      { name: 'IPv4', value: ip4.address },
      { name: 'IPv6', value: ip6 ? ip6.address : '' },
    ]

    bar.text = `$(home) ${ip4.address}`
    bar.tooltip = `${KEY}\n${(ip4.mac || '').toUpperCase()}\n\n${arr.map(item => `${item.name}: ${item.value}`).join('\n')}`
  }
}
