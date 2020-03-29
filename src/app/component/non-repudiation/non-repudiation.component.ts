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

  nonRepudiationForm: FormGroup;
  m: string;
  cryptoKey;
  key: string;
  algKeyGen;
  algEncrypt;
  keyUsages;
  c: string;
  signature: string;

  /**
   * Non-Repudiation constructor
   * @constructor
   * @param {rsaService} rsaService - RSA Service.
   * @param {formBuilder} formBuilder - FormBuilder to manage forms.
   */
  constructor(private rsaService: RsaService, private formBuilder: FormBuilder) {
    this.nonRepudiationForm = this.formBuilder.group({
      message: new FormControl('', Validators.required),
    });
    this.algKeyGen = {
      name: 'AES-CBC',
      length: 256
    };
    this.algEncrypt = {
      name: 'AES-CBC',
      iv: null
    };
    this.keyUsages = [
      'encrypt',
      'decrypt'
    ];
  }

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

  async sendMessage() {
    await this.encrypt();
    const body = {
      type: 1,
      src: "A",
      dst: "B",
      msg: this.c,
      timestamp: Date.now()
    };
    await this.digestBody(JSON.stringify(body))
      .then(data => this.keyPair.privateKey.sign(bc.bufToBigint(data)))
      .then(data => this.signature = bc.bigintToHex(data));
    console.log({
      body: body,
      signature: this.signature
      }
    );
  }

  async digestBody(body) {
    const encoder = new TextEncoder();
    const buffer = encoder.encode(body);
    return await crypto.subtle.digest('SHA-256', buffer);
  }
}
