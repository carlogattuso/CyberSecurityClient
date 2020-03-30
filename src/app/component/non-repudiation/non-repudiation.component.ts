import {Component, OnInit} from '@angular/core';
import {RsaService} from "../../services/rsa.service";
import * as rsa from 'rsa';
import * as bc from 'bigint-conversion';
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";

@Component({
  selector: 'app-no-repudiation',
  templateUrl: './non-repudiation.component.html',
  styleUrls: ['./non-repudiation.component.css']
})

/**
 * Component to test non-repudiation protocol
 *
 * Non-reliable channel
 * Non-reliable peers
 *
 * CyberSecurityClient -- Peer A
 * CyberSecurityServer -- Peer B
 * CyberSecurityTTP -- TTP
 *
 */
export class NonRepudiationComponent implements OnInit {
  /**
   * General Variables
   */

  /**
   * A's RSA keyPair
   * @name keyPair
   * @type {rsa.KeyPair}
   */
  keyPair: rsa.KeyPair;

  /**
   * Non-Repudiation Component constructor
   * @constructor
   * @param {rsaService} rsaService - RSA Service.
   * @param {formBuilder} formBuilder - FormBuilder to manage forms.
   */
  constructor(private rsaService: RsaService, private formBuilder: FormBuilder) {
    this.nrForm = this.formBuilder.group({
      m: new FormControl('', Validators.required),
    });
  }

  cryptoKey;
  key: string;

  async ngOnInit(){
    /** 256 bitLength keyPair generation */
    this.keyPair = await rsa.generateRandomKeys(256);

    /**
     * Generates CryptoKey using AES-256-CBC block cipher
     *
     * @return {CryptoKey} cryptoKey - cryptoKey with a 256-length key generated
     */
    await crypto.subtle.generateKey({name:'AES-CBC',length:256},true,['encrypt','decrypt'])
      .then(data => this.cryptoKey = data);

    /**
     * Exports 256-length key from previous CryptoKey
     *
     * @param {CryptoKey} cryptoKey - cryptoKey with extractable keys
     * @return {stringHex} key - 256-length key
     */
    await crypto.subtle.exportKey("raw",this.cryptoKey)
      .then(data => this.key = bc.bufToHex(data));
  }

  /** Encrption method */
  async encrypt() {
    /**
     * Encrypts any message with A-B symmetric key, using random iv
     *
     * @param {CryptoKey} cryptoKey - cryptoKey with extractable keys
     * @param {string} m - non-repudiated message
     * @return {stringHex} c - 256-length cipherText
     */
    await crypto.subtle.encrypt(
      {name:'AES-CBC',iv:crypto.getRandomValues(new Uint8Array(16))}, this.cryptoKey, bc.textToBuf(this.m))
      .then(data => this.c = bc.bufToHex(data));
  }

  /**
   * Non-repudiation protocol implementation starts
   */

  /**
   * Non-repudiation Form to manage messages
   * @name nrForm
   * @type {FormGroup}
   */
  nrForm: FormGroup;
  /**
   * Message that is sent to B
   * @name m
   * @type {string}
   */
  m: string;
  /**
   * Challenge cipherText to B, encrypted using '@name key'
   * @name m
   * @type {stringHex}
   */
  c: string;
  /**
   * Proof of origin (signed body digest)
   * @name signature
   * @type {stringHex}
   */
  signature: string;

  /** Sent message to peer B method */
  async sendMessage() {
    /** Get symmetric key + random iv to avoid security issues **/
    await this.encrypt();
    /**
     * Message body
     *
     * @param {number} type - Message type (This is the first one)
     * @param {string} src - Source peer A
     * @param {string} dts - Destination peer B
     * @param {stringHex} msg - CipherText to reveal message '@name m'
     * @param {stringHex} timestamp - Time consistency check
     */
    const body = {
      type: 1,
      src: "A",
      dst: "B",
      msg: this.c,
      timestamp: Date.now()
    };

    /** Signing digest of message body with SHA-256**/
    await this.digestBody(JSON.stringify(body))
      .then(data => this.keyPair.privateKey.sign(bc.bufToBigint(data)))
      .then(data => this.signature = bc.bigintToHex(data));
    console.log({
      body: body,
      signature: this.signature
      }
    );
  }

  /**
   * Digest any string with SHA-256 integrity hash function
   *
   * @param {string} body
   * @return {ArrayBuffer}
   */
  async digestBody(body) {
    const encoder = new TextEncoder();
    const buffer = encoder.encode(body);
    return await crypto.subtle.digest('SHA-256', buffer);
  }
}
