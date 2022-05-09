import os from 'os'
import type { ExtensionContext, StatusBarItem } from 'vscode'
import { StatusBarAlignment, commands, window, workspace } from 'vscode'
import { NEXT } from './constants'

export function activate(context: ExtensionContext) {
  let name: string = workspace.getConfiguration().get('showId.interfaceName') ?? 'WLAN'
  const statusBarItem = new IPAddressStatusBarItem(name)
  context.subscriptions.push(statusBarItem)

  context.subscriptions.push(workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('showId.interfaceName')) {
      name = workspace.getConfiguration().get('showId.interfaceName') ?? 'WLAN'
      statusBarItem.setInterfaceName(name)
      statusBarItem.refresh()
    }
  }))

  context.subscriptions.push(commands.registerCommand(NEXT, () => {
    statusBarItem.next()
  }))
}

class IPAddressStatusBarItem {
  private _statusBarItem: StatusBarItem
  private _refreshInterval: NodeJS.Timeout
  private _networkInterfaces?: os.NetworkInterfaceInfo[]
  private _interfaceName: string
  private _isFirst = true
  private _index = 0

  constructor(name: string) {
    this._interfaceName = name

    this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right)
    this._statusBarItem.show()

    this.refresh()

    this._refreshInterval = setInterval(() => this.refresh(), 60 * 1000)

    this._statusBarItem.command = NEXT
  }

  setInterfaceName(name: string) {
    this._interfaceName = name
  }

  dispose() {
    this._statusBarItem.dispose()
    clearInterval(this._refreshInterval)
  }

  next() {
    this._index++
    this._isFirst = false
    this.refresh()
  }

  refresh() {
    this.fetchNetworkInterfaces()
    this.refreshUI()
  }

  getNetworkInterfaces() {
    const networkInterfaces = os.networkInterfaces()
    const interfaces = Object.keys(networkInterfaces)

    if (this._isFirst) {
      this._isFirst = false
      this._index = interfaces.indexOf(this._interfaceName)
      if (this._index === -1)
        this._index = 0
    }
    else {
      this._index = this._index % interfaces.length
    }
    return [networkInterfaces[interfaces[this._index]], interfaces[this._index]] as const
  }

  fetchNetworkInterfaces() {
    const arr = this.getNetworkInterfaces()
    this._networkInterfaces = arr[0]
    this._interfaceName = arr[1]
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
    bar.tooltip = `${this._interfaceName}\n${(ip4.mac || '').toUpperCase()}\n\n${arr.map(item => `${item.name}: ${item.value}`).join('\n')}`
  }
}
