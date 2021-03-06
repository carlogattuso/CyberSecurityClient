import {Component, OnInit} from '@angular/core';
import * as rsa from 'rsa';
import * as bc from 'bigint-conversion';
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {NonRepudiationBService} from "../../services/non-repudiation-B.service";
import {NonRepudiationTTPService} from "../../services/non-repudiation-TTP.service";
import * as sha from 'object-sha';

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
   * B's RSA public key
   * @name aPubKey
   * @type {rsa.PublicKey}
   */
  bPubKey;

  /**
   * TTP's RSA public key
   * @name TTPPubKey
   * @type {rsa.PublicKey}
   */
  TTPPubKey;

  /**
   * Non-Repudiation Component constructor
   * @constructor
   * @param {NonRepudiationBService} nrBService - Non-Repudiation Service with peer B.
   * @param {NonRepudiationTTPService} nrTTPService - Non-Repudiation Service with peer TTP.
   * @param {formBuilder} formBuilder - FormBuilder to manage forms.
   */
  constructor(private nrBService: NonRepudiationBService, private nrTTPService: NonRepudiationTTPService, private formBuilder: FormBuilder) {
    this.nrForm = this.formBuilder.group({
      m: new FormControl('', Validators.required),
    });
  }

  /**
   * CryptoSubtle CryptoKey object
   * @name cryptoKey
   * @type {CryptoKey}
   */
  cryptoKey: CryptoKey;

  /**
   * AES-256-CBC key
   * @name key
   * @type {stringHex}
   */
  key: string;

  iv: Uint8Array;

  async ngOnInit() {
    /** 2048 bitLength keyPair generation */
    this.keyPair = await rsa.generateRandomKeys(2048);

    /**
     * Generates CryptoKey using AES-256-CBC block cipher
     *
     * @return {CryptoKey} cryptoKey - cryptoKey with a 256-length key generated
     */
    await crypto.subtle.generateKey({name: 'AES-CBC', length: 256}, true, ['encrypt', 'decrypt'])
      .then(data => this.cryptoKey = data);

    /**
     * Exports 256-length key from previous CryptoKey
     *
     * @param {CryptoKey} cryptoKey - cryptoKey with extractable keys
     * @return {stringHex} key - 256-length key
     */
    await crypto.subtle.exportKey("raw", this.cryptoKey)
      .then(data => this.key = bc.bufToHex(data));
  }

  /** Encrption method */
  async encrypt() {
    this.iv = crypto.getRandomValues(new Uint8Array(16));
    /**
     * Encrypts any message with A-B symmetric key, using random iv
     *
     * @param {CryptoKey} cryptoKey - cryptoKey with extractable keys
     * @param {string} m - non-repudiated message
     * @return {stringHex} c - 256-length cipherText
     */
    await crypto.subtle.encrypt(
      {name: 'AES-CBC', iv: this.iv}, this.cryptoKey, bc.textToBuf(this.m))
      .then(data => this.c = bc.bufToHex(data));
  }

  /**
   * Digest any string with SHA-256 integrity hash function
   *
   * @param {string} obj
   * @return {ArrayBuffer}
   */
  async digest(obj) {
    return await sha.digest(obj, 'SHA-256');
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
   * Proof of origin (signed body of message type 1 digest)
   * @name signature
   * @type {stringHex}
   */
  po: string;
  /**
   * Proof of reception (signed body of message type 2 digest)
   * @name pr
   * @type {stringHex}
   */
  pr: string;
  /**
   * Proof of key origin (signed body of message type 4 digest)
   * @name pkp
   * @type {stringHex}
   */
  pko: string;
  /**
   * Proof of key publication (signed body of message type 4 digest)
   * @name pkp
   * @type {stringHex}
   */
  pkp: string;

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
    let body = JSON.parse(JSON.stringify({type: 1, src: 'A', dst: 'B', msg: this.c, timestamp: Date.now()}));

    /** Signing digest of message body with SHA-256**/
    await this.digest(body)
      .then(data => this.keyPair.privateKey.sign(bc.hexToBigint(data)))
      .then(data => this.po = bc.bigintToHex(data));

    let json = JSON.parse(JSON.stringify({
      body: body, signature: this.po,
      pubKey: {e: bc.bigintToHex(this.keyPair.publicKey.e), n: bc.bigintToHex(this.keyPair.publicKey.n)}
    }));

    /** Falta comentar **/
    this.nrBService.sendMessage(json).subscribe(
      async data => {
        let res = JSON.parse(JSON.stringify(data));
        this.bPubKey = new rsa.PublicKey(bc.hexToBigint(res.pubKey.e), bc.hexToBigint(res.pubKey.n));
        let proofDigest = bc.bigintToHex(await this.bPubKey.verify(bc.hexToBigint(res.signature)));
        let bodyDigest = await this.digest(res.body);
        if (bodyDigest.trim() === proofDigest.trim() && this.checkTimestamp(res.body.timestamp)) {
          this.pr = res.signature;
          let body = JSON.parse(JSON.stringify({type: 3, src: 'A', dst: 'TTP', msg: this.key, iv: bc.bufToHex(this.iv), timestamp: Date.now()}));

          await this.digest(body)
            .then(data => this.keyPair.privateKey.sign(bc.hexToBigint(data)))
            .then(data => this.pko = bc.bigintToHex(data));

          let json = JSON.parse(JSON.stringify({
            body: body, signature: this.pko,
            pubKey: {e: bc.bigintToHex(this.keyPair.publicKey.e), n: bc.bigintToHex(this.keyPair.publicKey.n)}
          }));

          this.nrTTPService.sendKey(json).subscribe(
            async data => {
              let res = JSON.parse(JSON.stringify(data));
              this.TTPPubKey = new rsa.PublicKey(bc.hexToBigint(res.pubKey.e), bc.hexToBigint(res.pubKey.n));
              let proofDigest = bc.bigintToHex(await this.TTPPubKey.verify(bc.hexToBigint(res.signature)));
              let bodyDigest = await sha.digest(res.body);
              if (bodyDigest === proofDigest) {
                this.pkp = res.signature;
                console.log("All data verified");
                console.log({
                  pr: this.pr,
                  pkp: this.pkp
                });

                /** Showing values once promises are finished and services are subscribed */
                document.getElementById('proof-reception').innerHTML = this.pr as string;
                document.getElementById('proof-key-pub').innerHTML = this.pkp as string;
              }
            });

        } else {
          console.log("Bad authentication of proof of reception");
        }
      });
  }

  checkTimestamp(timestamp:number) {
    const time = Date.now();
    return (timestamp > (time - 300000) && timestamp < (time + 300000));
  }
}
