import React from 'react'
import { translate } from 'react-i18next'
import { action, computed, observable, reaction } from 'mobx'
import { inject, observer } from 'mobx-react'
import { AutoComplete, Button, Col, Input, Popover, Row, message } from 'antd'

/** Load translation namespaces and delay rendering until they are loaded. */
@translate(['wallet'], { wait: true })

/** Make the component reactive and inject MobX stores. */
@inject('info', 'rpc', 'wallet') @observer

export default class KeyImport extends React.Component {
  @observable privateKey = ''
  @observable account = ''
  @observable loading = false
  @observable popover = false
  @observable error = false

  constructor (props) {
    super(props)
    this.t = props.t
    this.info = props.info
    this.rpc = props.rpc
    this.wallet = props.wallet

    /** Clear previous error on private key change. */
    reaction(() => this.privateKey, (privateKey) => {
      if (privateKey !== '') {
        this.setError()
      }
    })

    /** Clear private key when popover closes. */
    reaction(() => this.popover, (popover) => {
      if (popover === false) {
        if (this.privateKey !== '') {
          this.setPrivateKey()
        }
      }
    })
  }

  /**
   * Get error status.
   * @function errorStatus
   * @return {string|false} Current error or false if none.
   */
  @computed get errorStatus () {
    if (this.account.match(/^[a-zA-Z0-9 -]{0,100}$/) === null) {
      return 'invalidCharacters'
    }

    if (this.privateKey.length < 51) return 'incompleteKey'
    if (this.error !== false) return this.error
    return false
  }

  /**
   * Set RPC error.
   * @function setError
   * @param {string} error - RPC error.
   */
  @action setError = (error = false) => {
    this.error = error
  }

  /**
   * Set account.
   * @function setAccount
   * @param {string} account - Account name.
   */
  @action setAccount = (account) => {
    this.account = account
  }

  /**
   * Set private key.
   * @function setPrivateKey
   * @param {object} e - Input element event.
   */
  @action setPrivateKey = (e) => {
    if (e === undefined) {
      this.privateKey = ''
    } else {
      if (e.target.value.match(/^[a-zA-Z0-9]{0,52}$/) !== null) {
        this.privateKey = e.target.value
      }
    }
  }

  /**
   * Toggle loading.
   * @function toggleLoading
   */
  @action toggleLoading = () => {
    this.loading = !this.loading
  }

  /**
   * Toggle visibility of popover.
   * @function togglePopover
   */
  @action togglePopover = () => {
    if (this.info.isLocked === false) {
      this.popover = !this.popover
    }
  }

  /**
   * Import private key.
   * @function importKey
   */
  importKey = () => {
    /** Disable the button and show the loading indicator. */
    this.toggleLoading()

    this.rpc.execute([
      { method: 'importprivkey', params: [this.privateKey, this.account] }
    ], (response) => {
      /** Re-enable the button and hide the loading indicator. */
      this.toggleLoading()

      /** Handle result. */
      if (response[0].hasOwnProperty('result') === true) {
        /** Close popover if still open. */
        if (this.popover === true) this.togglePopover()

        /** Get txs that use the imported address and update address list. */
        this.wallet.getWallet(true, true)

        /** Display a success message. */
        message.success(this.t('wallet:privateKeyImported'), 6)
      }

      /** Handle error. */
      if (response[0].hasOwnProperty('error') === true) {
        /** Convert error code to string. */
        switch (response[0].error.code) {
          /** -4 = error_code_wallet_error */
          case -4:
            this.setError('isMine')
            break

          /** -5 = error_code_invalid_address_or_key */
          case -5:
            this.setError('invalidKey')
            break
        }
      }
    })
  }

  popoverContent () {
    return (
      <div style={{width: '400px'}}>
        <Row>
          <Col span={24}>
            <Input
              style={{margin: '0 0 5px 0'}}
              placeholder={this.t('wallet:privateKey')}
              value={this.privateKey}
              onChange={this.setPrivateKey}
            />
          </Col>
        </Row>
        <Row>
          <Col span={24} style={{height: '28px'}}>
            <AutoComplete
              placeholder={this.t('wallet:accountName')}
              style={{width: '100%'}}
              getPopupContainer={triggerNode => triggerNode.parentNode}
              value={this.account}
              dataSource={this.wallet.accounts}
              onChange={this.setAccount}
            />
          </Col>
        </Row>
        <Row>
          <Col span={14}>
            <p className='red' style={{margin: '3px 0 3px 1px'}}>
              {
                (
                  this.errorStatus === 'invalidCharacters' &&
                  this.t('wallet:accountInvalidCharacters')
                ) || (
                  this.errorStatus === 'invalidKey' &&
                  this.t('wallet:privateKeyInvalid')
                ) || (
                  this.errorStatus === 'isMine' &&
                  this.t('wallet:privateKeyIsMine')
                )
              }
            </p>
          </Col>
          <Col span={10} style={{textAlign: 'right'}}>
            <Button
              style={{margin: '5px 0 0 0'}}
              onClick={this.importKey}
              disabled={this.errorStatus !== false}
              loading={this.loading === true}
            >
              {this.t('wallet:privateKeyImport')}
            </Button>
          </Col>
        </Row>
      </div>
    )
  }

  render () {
    return (
      <Popover
        trigger='click'
        placement='bottomLeft'
        title={this.t('wallet:privateKeyImportLong')}
        visible={this.popover}
        onVisibleChange={this.togglePopover}
        content={this.popoverContent()}
      >
        <Button
          disabled={this.info.isLocked === true}
          size='small'
        >
          {this.t('wallet:privateKeyImport')}
        </Button>
      </Popover>
    )
  }
}
