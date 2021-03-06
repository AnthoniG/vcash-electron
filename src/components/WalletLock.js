import React from 'react'
import { translate } from 'react-i18next'
import { inject, observer } from 'mobx-react'
import { Button, Tooltip, message } from 'antd'

/** Load translation namespaces and delay rendering until they are loaded. */
@translate(['wallet'], { wait: true })

/** Make the component reactive and inject MobX stores. */
@inject('info', 'rpc') @observer

export default class WalletLock extends React.Component {
  constructor (props) {
    super(props)
    this.t = props.t
    this.info = props.info
    this.rpc = props.rpc
  }

  /**
   * Lock the wallet.
   * @function lock
   */
  lock = () => {
    this.rpc.execute([
      { method: 'walletlock', params: [] }
    ], (response) => {
      /** Handle result. */
      if (response[0].hasOwnProperty('result') === true) {
        /** Update lock status. */
        this.info.getLockStatus()

        /** Display a success message. */
        message.success(this.t('wallet:locked'), 6)
      }
    })
  }

  render () {
    if (
      this.info.isEncrypted === false ||
      this.info.isLocked === true
    ) return null

    return (
      <Tooltip
        title={this.t('wallet:unlocked')}
        placement='bottomRight'
      >
        <Button
          size='small'
          type='primary'
          onClick={this.lock}
        >
          <i className='material-icons md-20'>lock_open</i>
        </Button>
      </Tooltip>
    )
  }
}
