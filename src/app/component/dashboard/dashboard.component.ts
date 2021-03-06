import { Component, OnInit } from '@angular/core';
import { RsaService } from '../../services/rsa.service';
import * as rsa from 'rsa';
import * as bc from 'bigint-conversion';
import * as bcu from 'bigint-crypto-utils';
import {Form, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import * as io from 'socket.io-client';

@Component({
  selector: 'app-blind-signature',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
/**
 * Component to test rsa module (@import * as rsa)
 * doing basic asymmetric cryptography operations (encrypt-decrypt,sign-verify)
 */
export class DashboardComponent implements OnInit {
  /**
   * General Variables
   */

  /**
   * RSA public key from server to start communication
   * @name publicKey
   * @type {rsa.PublicKey}
   */
  pubKey;

  /**
   * Save number one for more handy bigint operations
   * @name _ONE
   * @type {BigInt}
   */
  _ONE:BigInt = BigInt(1);

  socket;

  /**
   * Enables sending current slice
   * @name enableSend
   * @type {boolean}
   */
  enableSend:boolean;

  /**
   * DashBoard constructor
   * @constructor
   * @param {rsaService} rsaService - RSA Service.
   * @param {formBuilder} formBuilder - FormBuilder to manage forms.
   */
  constructor(private rsaService: RsaService, private formBuilder: FormBuilder) {
    this.bsForm = this.formBuilder.group({
      bsm: new FormControl('', Validators.required),
    });
    this.sForm = this.formBuilder.group({
      sm: new FormControl('', Validators.required),
    });
    this.encForm = this.formBuilder.group({
      em: new FormControl('', Validators.required),
    });
  }

  async ngOnInit() {
    /** We get from rsa service the public key of server */
    this.rsaService.getPublicKey().subscribe(
      data => {
        this.pubKey = new rsa.PublicKey(bc.hexToBigint(data.e), bc.hexToBigint(data.n));
        console.log(this.pubKey);
      }
    );
    this.socket = io('http://localhost:50003');
    this.socket.on('hi', (data) => {
      this.welcome = data;
    });
    this.socket.on('secret', (data) => {
      this.slice = data.slice;
      this.secret = data.secret;
      console.log("A new secret has been shared: ");
      console.log({secret: this.secret});
      console.log("My slice of the secret is: ");
      console.log({slice: this.slice});
      this.enableSend = true;
      this.recovered = "";
    });
    this.socket.on('recovered', (data) => {
      this.recovered = data;
      this.enableSend = false;
      console.log("The secret has been finally recovered: ");
      console.log({recovered: this.recovered});
    });
  }

  /**
   * Signature
   *
   * Test signature using server's keyPair
   *
   */

  /**
   * Form Group to manage signature form
   * @name sForm
   * @type {FormGroup}
   */
  sForm: FormGroup;
  /**
   * Simple message to be signed
   * @name sm
   * @type {string}
   */
  sm: string;
  /**
   * Message's signature from server
   * @name s1
   * @type {stringHex}
   */
  s1: string;
  /**
   * Verified message from server
   * @name sClearText
   * @type {string}
   */
  sClearText: string;

  /** Signature test method */
  async getSignature(){
    this.rsaService.signMessage(bc.bigintToHex(bc.textToBigint(this.sm))).subscribe(
      /** We receive signature from server */
      async data => {
        this.s1 = data.signature;
        console.log("Signature sent by the server: ", this.s1);
        /**
         * Verifies signature received from server
         *
         * @param {string} s1 - signature to verify
         * @return {stringHex} sClearText - clearText (if it is working, must match with '@name sm')
         */
        this.sClearText= bc.bigintToText(await this.pubKey.verify(bc.hexToBigint(this.s1)));
        console.log("Original message sent by the client after verifying the Signed message: ", this.sClearText);

        /** Showing values once promises are finished and services are subscribed */
        document.getElementById('signature').innerHTML = this.s1 as string;
        document.getElementById('signature-clear-text').innerHTML = this.sClearText as string;
      }
    );
  }

  /**
   * Blind Signature
   *
   * Test blind signature using server's keyPair
   *
   */

  /**
   * Form Group to manage encryption form
   * @name bsForm
   * @type {FormGroup}
   */
  bsForm: FormGroup;
  /**
   * Simple message to send before blind factor
   * @name bsm
   * @type {string}
   */
  bsm: string;
  /**
   * Blinding factor
   * @name r
   * @type {bigint}
   */
  r: bigint;
  /**
   * Blinded message
   * @name bm
   * @type {stringHex}
   */
  bm: string;
  /**
   * Blind signature got from server
   * @name bs
   * @type {stringHex}
   */
  bs: string;
  /**
   * Signature without blinding factor
   * @name bs
   * @type {bigint}
   */
  s2: bigint;
  /**
   * Verified message from server
   * @name bsClearText
   * @type {string}
   */
  bsClearText: string;

  /** Blind signature test method */
  async blindSignature() {
    console.log("Message sent: ", this.bsm);
    do {
      /** Random number inside modulo n as blind factor */
      this.r = await bcu.prime(bcu.bitLength(this.pubKey.n));
      console.log("Blinding factor (random modn): ", this.r);
    }
    /** Verify if is coprime with r in order to do the inverse modulo **/
    while (!(bcu.gcd(this.r,this.pubKey.n) === this._ONE));

    /**
     * Generates a blinded message with a random blinding factor.
     *
     * @param {bigint} r - the blinding factor
     * @param {string} bsm - user input message
     * @param {bigint} n - public key's modulo
     * @return {stringHex} bm - blinded message as string
     */
    let e = await this.pubKey.encrypt(this.r);
    this.bm = bc.bigintToHex(await e*bc.textToBigint(this.bsm)%this.pubKey.n);
    console.log("Blind message: ", this.bm);

    this.rsaService.signMessage(this.bm).subscribe(
      /** We receive blind signature from server */
      async data => {
        this.bs = data.signature;
        console.log("Blind signature message sent by the server: ", this.bs);

        /**
         * Takes blinding factor of the blind signature
         *
         * @param {string} bs - the blind signature
         * @param {bigint} r - the blinding factor
         * @param {bigint} n - public key's modulo
         * @return {bigint} s - signature from server
         */
        this.s2 = await (bc.hexToBigint(this.bs)*bcu.modInv(this.r, this.pubKey.n))%this.pubKey.n;
        console.log("Signed message (multiply by the inverse of the blinding factor): ", this.s2);
        /**
         * Verifies signature received from server
         *
         * @param {string} s - signature to verify
         * @return {bigint} bsClearText - clearText (if it is working, must match with '@name bsm')
         */
        this.bsClearText = bc.bigintToText(await this.pubKey.verify(this.s2));
        console.log("Original message sent by the client after verifying the Signed message: ", this.bsClearText);

        /** Showing values once promises are finished and services are subscribed */
        document.getElementById('blind-message').innerHTML = this.bm as string;
        document.getElementById('blind-signature').innerHTML = this.bs as string;
        document.getElementById('blind-clear-text').innerHTML = this.bsClearText as string;
      }
    );
  }

  /**
   * Encryption
   *
   * Test encryption/decryption with server's keyPair
   *
   */

  /**
   * Form Group to manage encryption form
   * @name encForm
   * @type {FormGroup}
   */
  encForm: FormGroup;
  /**
   * Simple message to encrypt
   * @name em
   * @type {string}
   */
  em: string;
  /**
   * Encrypted message to send
   * @name c
   * @type {stringHex}
   */
  c;
  /**
   * Verified message from server
   * @name eClearText
   * @type {string}
   */
  eClearText: string;

  /** Encryption test method */
  async encryption() {
    /**
     * Generates a cryptoText using server's public key.
     *
     * @param {string} em - the message to encrypt
     * @return {stringHex} c - cryptoMessage to send to server
     */
    this.c = bc.bigintToHex(await this.pubKey.encrypt(bc.textToBigint(this.em)));
    console.log("Encrypted message: ", this.c);
    this.rsaService.checkClearText(this.c).subscribe(
      /** We receive the decrypted message from server (if it works it is the same as '@name em') */
      data => {
        console.log("Decrypted message sent to the client: ", data.clearText);
        /** Formatting received message from StringHex to string */
        this.eClearText = bc.bigintToText(bc.hexToBigint(data.clearText));
        console.log("Original message sent by the client (decrypted message): ", this.eClearText);
        /** Showing values once promises are finished and services are subscribed */
        document.getElementById('crypto-message').innerHTML = this.c as string;
        document.getElementById('crypto-clear-text').innerHTML = this.eClearText as string;
      }
    );
  }

  /**
   * Shamir's secret key sharing
   *
   * Test of slicing and recovering a secret key to decrypt message
   * with Shamir's secret key sharing implementation
   *
   */

  /**
   * Form Group to manage Shamir's secret sharing form
   * @name sssForm
   * @type {FormGroup}
   */
  ssForm: FormGroup;

  /**
   * Shamir's sharing key secret
   * @name secret
   * @type {string}
   */
  secret: string;

  /**
  * Key slice
  * @name slice
  * @type {string}
  */
  slice: string;

  /**
   * Key recovered
   * @name recovered
   * @type {string}
   */
  recovered: string;

  /**
   * Welcome to server
   * @name welcome
   * @type {string}
   */
  welcome: string;

  /**
   * CryptoSubtle CryptoKey object
   * @name cryptoKey
   * @type {CryptoKey}
   */
  cryptoKey: CryptoKey;

  /** Send Shamir's secret key slice */
  async sendSlice() {
    this.socket.emit('slice', this.slice);
    console.log("I am trying to recover the secret: ");
    console.log({slice: this.slice});
    this.enableSend = false;
  }
}
