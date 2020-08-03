/**
 * Sample React Native App
 *
 * adapted from App.js generated by the following command:
 *
 * react-native init example
 *
 * https://github.com/facebook/react-native
 */

import React, {Component} from 'react'
import {StyleSheet, Text, View} from 'react-native'
import {
  Address,
  BaseAddress,
  BigNum,
  Bip32PrivateKey,
  BootstrapWitness,
  BootstrapWitnesses,
  ByronAddress,
  Coin,
  Ed25519KeyHash,
  LinearFee,
  make_vkey_witness,
  make_icarus_bootstrap_witness,
  StakeCredential,
  Transaction,
  TransactionBuilder,
  TransactionBody,
  TransactionHash,
  TransactionInput,
  TransactionOutput,
  TransactionWitnessSet,
  UnitInterval,
  Vkeywitness,
  Vkeywitnesses,
} from 'react-native-haskell-shelley'

const assert = (value: any, message: string, ...args: any) => {
  if (value) {
    return
  }
  console.error(`Assertion failed: ${message}`, ...args)
  throw new Error(message)
}

export default class App extends Component<{}> {
  state = {
    status: 'starting',
  }
  async componentDidMount() {
    const addrHex = '0000b03c3aa052f51c086c54bd4059ead2d2e426ac89fa4b3ce41cbf' // 28B
    const addrBytes = Buffer.from(addrHex, 'hex')

    try {
      // ------------------------------------------------
      // -------------------- BigNum --------------------
      const bigNumStr = '1000000'
      const bigNum = await BigNum.from_str(bigNumStr)
      assert(
        (await bigNum.to_str()) === bigNumStr,
        'BigNum.to_str() should match original input value',
      )

      // ------------------------------------------------
      // ------------------- Coin -----------------------
      const coinStr = '2000000'
      const coin = await Coin.from_str(coinStr)
      assert(
        (await coin.to_str()) === coinStr,
        'Coin.to_str() should match original input value',
      )

      // ------------------------------------------------
      // --------------- Bip32PrivateKey ----------------
      const xprvBytes =
        '70afd5ff1f7f551c481b7e3f3541f7c63f5f6bcb293af92565af3deea0bcd648' +
        '1a6e7b8acbe38f3906c63ccbe8b2d9b876572651ac5d2afc0aca284d9412bb1b' +
        '4839bf02e1d990056d0f06af22ce4bcca52ac00f1074324aab96bbaaaccf290d'
      const bip32PrivateKey = await Bip32PrivateKey.from_bytes(
        Buffer.from(xprvBytes, 'hex'),
      )
      assert(
        Buffer.from(await bip32PrivateKey.as_bytes()).toString('hex') ===
          xprvBytes,
        'bip32PrivateKey.as_bytes() should match original input value',
      )

      // ------------------------------------------------
      // ------------------ Address ---------------------
      const baseAddrHex =
        '00' +
        '0000b03c3aa052f51c086c54bd4059ead2d2e426ac89fa4b3ce41cbf' +
        '0000b03c3aa052f51c086c54bd4059ead2d2e426ac89fa4b3ce41cbf'
      const baseAddrBytes = Buffer.from(baseAddrHex, 'hex')
      const address = await Address.from_bytes(baseAddrBytes)
      const addrPtrToBytes = await address.to_bytes()
      assert(
        Buffer.from(addrPtrToBytes).toString('hex') === baseAddrHex,
        'Address.to_bytes should match original input address',
      )

      // ------------------------------------------------
      // ----------------- ByronAddress -----------------
      const addrBase58 =
        'Ae2tdPwUPEZHu3NZa6kCwet2msq4xrBXKHBDvogFKwMsF18Jca8JHLRBas7'
      const byronAddress = await ByronAddress.from_base58(addrBase58)
      assert(
        (await byronAddress.to_base58()) === addrBase58,
        'ByronAddress.to_base58 should match original input address',
      )
      const byronAddrFromAddr = await ByronAddress.from_address(address)
      assert(
        byronAddrFromAddr === undefined,
        'ByronAddress.from_address should return undefined on non-byron Address',
      )
      assert(
        !(await ByronAddress.is_valid(baseAddrHex)),
        'ByronAddress.is_valid should return false on non-byron Address',
      )

      // ------------------------------------------------
      // ---------------- Ed25519KeyHash ----------------
      const ed25519KeyHash = await Ed25519KeyHash.from_bytes(addrBytes)
      const addrToBytes = await ed25519KeyHash.to_bytes()
      assert(
        Buffer.from(addrToBytes).toString('hex') === addrHex,
        'Ed25519KeyHash.to_bytes should match original input address',
      )

      // ------------------------------------------------
      // --------------- TransactionHash ----------------
      const hash32Hex =
        '0000b03c3aa052f51c086c54bd4059ead2d2e426ac89fa4b3ce41cbf3ce41cbf'
      const hash32Bytes = Buffer.from(hash32Hex, 'hex')
      const txHash = await TransactionHash.from_bytes(hash32Bytes)
      const txHashToBytes = await txHash.to_bytes()
      assert(
        Buffer.from(txHashToBytes).toString('hex') === hash32Hex,
        'TransactionHash.to_bytes should match original input address',
      )

      // ------------------------------------------------
      // --------------- StakeCredential ----------------
      const stakeCred = await StakeCredential.from_keyhash(ed25519KeyHash)
      const ed25519KeyHashOrig = await stakeCred.to_keyhash()
      const stakeCredBytes = await stakeCred.to_bytes()
      const stakeCredFromBytes = await StakeCredential.from_bytes(
        Buffer.from(stakeCredBytes, 'hex'),
      )
      assert(
        Buffer.from(await ed25519KeyHashOrig.to_bytes()).toString('hex') ===
          addrHex,
        'StakeCredential:: -> to_keyhash -> to_bytes should match original input',
      )
      assert(
        (await stakeCred.kind()) === 0,
        'StakeCredential:: kind should match',
      )
      assert(
        Buffer.from(
          await (await stakeCredFromBytes.to_keyhash()).to_bytes(),
        ).toString('hex') === addrHex,
        'StakeCredential -> to_bytes -> from_bytes -> to_keyhash -> should match',
      )

      // ------------------------------------------------
      // ----------------- BaseAddress ------------------
      const pymntAddr =
        '0000b03c3aa052f51c086c54bd4059ead2d2e426ac89fa4b3ce41c0a' // 28B
      const pymntAddrKeyHash = await Ed25519KeyHash.from_bytes(
        Buffer.from(pymntAddr, 'hex'),
      )
      const paymentCred = await StakeCredential.from_keyhash(pymntAddrKeyHash)
      const baseAddr = await BaseAddress.new(0, paymentCred, stakeCred)

      const pymntCredFromBaseAddr = await baseAddr.payment_cred()
      const pymntAddrFromPymntCred = await pymntCredFromBaseAddr.to_keyhash()
      assert(
        Buffer.from(await pymntAddrFromPymntCred.to_bytes()).toString('hex') ===
          pymntAddr,
        'BaseAddress:: -> payment_cred -> keyhash should match original input',
      )
      const baseAddrFromAddr = await BaseAddress.from_address(address)
      assert(!!baseAddrFromAddr, 'baseAddress.from_address')

      // ------------------------------------------------
      // ------------------ UnitInterval ----------------
      const numeratorStr = '1000000'
      const denominatorStr = '1000000'
      const numeratorBigNum = await BigNum.from_str(numeratorStr)
      const denominatorBigNum = await BigNum.from_str(denominatorStr)
      const unitInterval = await UnitInterval.new(
        numeratorBigNum,
        denominatorBigNum,
      )

      // ------------------------------------------------
      // --------------- TransactionInput ---------------
      const txInput = await TransactionInput.new(txHash, 0)
      assert(
        (await txInput.index()) === 0,
        'TransactionInput:: index should match',
      )
      // prettier-ignore
      assert(
        Buffer.from(
          (await (await txInput.transaction_id()).to_bytes()),
        ).toString('hex') === Buffer.from(txHashToBytes).toString('hex'),
        'TransactionInput:: transaction id should match',
      )

      // ------------------------------------------------
      // -------------- TransactionOutput ---------------
      const amountStr = '1000000'
      const amount = await Coin.from_str(amountStr)
      const recipientAddr = await Address.from_bytes(baseAddrBytes)
      const txOutput = await TransactionOutput.new(recipientAddr, amount)
      assert(
        txOutput instanceof TransactionOutput,
        'TransactionOutput.new should return instance of TransactionOutput',
      )

      // ------------------------------------------------
      // ------------------- LinearFee ------------------
      const coeffStr = '44'
      const constStr = '155381'
      const coeff = await Coin.from_str(coeffStr)
      const constant = await Coin.from_str(constStr)
      const fee = await LinearFee.new(coeff, constant)
      assert(
        (await (await fee.coefficient()).to_str()) === coeffStr,
        'LinearFee.coefficient() should match original input',
      )
      assert(
        (await (await fee.constant()).to_str()) === constStr,
        'LinearFee.constant() should match original input',
      )

      // ------------------------------------------------
      // -------------------- Utils ---------------------
      const bootstrapWitness = await make_icarus_bootstrap_witness(
        txHash,
        byronAddress,
        bip32PrivateKey,
      )
      assert(
        bootstrapWitness instanceof BootstrapWitness,
        'make_icarus_bootstrap_witness should return instance of BootstrapWitness',
      )
      const sk = await bip32PrivateKey.to_raw_key()
      const vkeywitness = await make_vkey_witness(txHash, sk)
      assert(
        vkeywitness instanceof Vkeywitness,
        'make_vkey_witness should return instance of Vkeywitness',
      )

      // ------------------------------------------------
      // -------------- BootstrapWitnesses --------------
      const bootstrapWits = await BootstrapWitnesses.new()
      assert(
        (await bootstrapWits.len()) === 0,
        'BootstrapWitnesses.len() should return 0',
      )

      // ------------------------------------------------
      // ---------------- Vkeywitnesses -----------------
      const vkeyWits = await Vkeywitnesses.new()
      assert(
        (await vkeyWits.len()) === 0,
        'Vkeywitnesses.len() should return 0',
      )

      // ------------------------------------------------
      // ------------ TransactionWitnessSet -------------
      const witSet = await TransactionWitnessSet.new()

      // ------------------------------------------------
      // ---------------- TransactionBody ---------------
      const bodyHex =
        'a4008282582005ec4a4a7f4645fa66886cef2e34706907a3a7f9d8' +
        '8e0d48b313ad2cdf76fb5f008258206930f123df83e4178b0324ae' +
        '617b2028c0b38c6ff4660583a2abf1f7b08195fe00018182582b82' +
        'd818582183581ce3a1faa5b54bd1485a424d8f9b5e75296b328a2a' +
        '624ef1d2f4c7b480a0001a88e5cdab1913890219042803191c20'
      const txBody = await TransactionBody.from_bytes(
        Buffer.from(bodyHex, 'hex'),
      )

      // ------------------------------------------------
      // ----------------- Transaction ------------------
      const tx = await Transaction.new(txBody, witSet)

      // tx bytes extracted from yoroi tests
      const txHex =
        '83a4008282582005ec4a4a7f4645fa66886cef2e34706907a3a7f9' +
        'd88e0d48b313ad2cdf76fb5f008258206930f123df83e4178b0324' +
        'ae617b2028c0b38c6ff4660583a2abf1f7b08195fe00018182582b' +
        '82d818582183581ce3a1faa5b54bd1485a424d8f9b5e75296b328a' +
        '2a624ef1d2f4c7b480a0001a88e5cdab1913890219042803191c20' +
        'a102818458208fb03c3aa052f51c086c54bd4059ead2d2e426ac89' +
        'fa4b3ce41cbfd8800b51c0584053685c27ee95dc8e2ea87e6c9e7b' +
        '0557c7d060cc9d18ada7df3c2eec5949011c76e8647b072fe3fa83' +
        '10894f087b097cbb15d7fbcc743100a716bf5df3c6190058202623' +
        'fceb96b07408531a5cb259f53845a38d6b68928e7c0c7e390f0754' +
        '5d0e6241a0f6'
      const txFromBytes = await Transaction.from_bytes(
        Buffer.from(txHex, 'hex'),
      )
      assert(
        Buffer.from(await txFromBytes.to_bytes()).toString('hex') === txHex,
        'Transaction:: -> from_bytes -> to_bytes should match original input',
      )

      // ------------------------------------------------
      // -------------- TransactionBuilder --------------
      // note: changing some of the function parameters will result in some tests
      // failing.
      const minUtxoVal = await Coin.from_str('1000000')
      const poolDeposit = await BigNum.from_str('2000000')
      const keyDeposit = await BigNum.from_str('3000000')
      const txBuilder = await TransactionBuilder.new(
        fee,
        minUtxoVal,
        poolDeposit,
        keyDeposit,
      )
      await txBuilder.add_key_input(
        ed25519KeyHash,
        txInput,
        await Coin.from_str('1000000'),
      )
      await txBuilder.add_bootstrap_input(
        byronAddress,
        txInput,
        await Coin.from_str('1000000'),
      )
      await txBuilder.add_output(txOutput)
      // commented out so that we can test add_change_if_needed(), which
      // throws if fee has been previously set
      // await txBuilder.set_fee(await Coin.from_str('500000'))
      await txBuilder.set_ttl(10)
      assert(
        (await (await txBuilder.get_explicit_input()).to_str()) === '2000000',
        'TransactionBuilder::get_explicit_input()',
      )
      assert(
        parseInt(await (await txBuilder.get_implicit_input()).to_str(), 10) ===
          0,
        'TransactionBuilder::get_implicit_input()',
      )
      assert(
        (await (await txBuilder.get_explicit_output()).to_str()) === '1000000',
        'TransactionBuilder::get_explicit_output()',
      )
      const changeAddrHex =
        '00' +
        '0000b04c3aa051f51c086c54bd4059ead2d2e426ac89fa4b3ce41cbf' +
        '0000b03c3aa052f51c084c54bd4059ead2d2e426ac89fa4b3ce41cbf'
      const change = await Address.from_bytes(Buffer.from(changeAddrHex, 'hex'))
      assert(
        (await txBuilder.add_change_if_needed(change)) === false,
        'TransactionBuilder::add_change_if_needed()',
      )
      const txBodyFromBuilder = await txBuilder.build()
      // note: estimated fee changed after .build()
      assert(
        (await (await txBuilder.estimate_fee()).to_str()) === '172761',
        'TransactionBuilder::estimate_fee()',
      )

      console.log('bip32PrivateKey', bip32PrivateKey)
      console.log('address', address)
      console.log('ed25519KeyHash', ed25519KeyHash)
      console.log('txHash', txHash)
      console.log('pymntAddrKeyHash', pymntAddrKeyHash)
      console.log('paymentCred', paymentCred)
      console.log('stakeCred', stakeCred)
      console.log('baseAddr', baseAddr)
      console.log('unitInterval', unitInterval)
      console.log('txInput', txInput)
      console.log('txOutput', txOutput)
      console.log('fee', fee)
      console.log('bootstrapWitness', bootstrapWitness)
      console.log('vkeywitness', vkeywitness)
      console.log('witSet', witSet)
      console.log('txBody', txBody)
      console.log('tx', tx)
      console.log('txBuilder', txBuilder)
      console.log('txBodyFromBuilder', txBodyFromBuilder)

      /* eslint-disable-next-line react/no-did-mount-set-state */
      this.setState({
        status: 'tests finished',
      })
    } catch (e) {
      console.log(e)
      /* eslint-disable-next-line react/no-did-mount-set-state */
      this.setState({
        status: e.message,
      })
    }
  }
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>☆HaskellShelley example☆</Text>
        <Text style={styles.instructions}>STATUS: {this.state.status}</Text>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
})
