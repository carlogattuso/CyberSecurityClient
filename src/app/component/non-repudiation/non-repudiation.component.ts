import {Component, OnInit} from '@angular/core';
import * as rsa from 'rsa';
import * as bc from 'bigint-conversion';
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {NonRepudiationBService} from "../../services/non-repudiation-B.service";
import {NonRepudiationTTPService} from "../../services/non-repudiation-TTP.service";
import * as sha from 'object-sha';
import {webSocket, WebSocketSubject} from 'rxjs/webSocket';

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
   * B's RSA public key
   * @name aPubKey
   * @type {rsa.PublicKey}
   */
  TTPPubKey;

  myWebSocket: WebSocketSubject<JSON> = webSocket('ws://localhost:50001');

  /**
   * Non-Repudiation Component constructor
   * @constructor
   * @param {NonRepudiationBService} nrBService - Non-Repudiation Service with peer B.
   * @param {NonRepudiationTTPService} nrTTPService - Non-Repudiation Service with peer TTP.
   * @param {formBuilder} formBuilder - FormBuilder to manage forms.
   * @param {WebSocket} ws - Websocket with TTP to subscribe for the publication key + proof of publication
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
  cryptoKey;
  /**
   * AES-256-CBC key
   * @name key
   * @type {stringHex}
   */
  key: string;

  async ngOnInit() {

    this.myWebSocket.next(JSON.parse(JSON.stringify({
      request: 'SUBSCRIBE',
      message: '',
      channel: 'key'
    })));

    /** 256 bitLength keyPair generation */
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
    /**
     * Encrypts any message with A-B symmetric key, using random iv
     *
     * @param {CryptoKey} cryptoKey - cryptoKey with extractable keys
     * @param {string} m - non-repudiated message
     * @return {stringHex} c - 256-length cipherText
     */
    await crypto.subtle.encrypt(
      {name: 'AES-CBC', iv: crypto.getRandomValues(new Uint8Array(16))}, this.cryptoKey, bc.textToBuf(this.m))
      .then(data => this.c = bc.bufToHex(data));
  }

  /**
   * Digest any string with SHA-256 integrity hash function
   *
   * @param {string} obj
   * @return {ArrayBuffer}
   */
  async digestBody(obj) {
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
    await this.digestBody(body)
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
        let bodyDigest = await sha.digest(res.body);
        if (bodyDigest === proofDigest) {
          this.pr = res.signature;
          let body = JSON.parse(JSON.stringify({type: 3, src: 'A', dst: 'TTP', msg: this.key, timestamp: Date.now()}));

          await this.digestBody(body)
            .then(data => this.keyPair.privateKey.sign(bc.hexToBigint(data)))
            .then(data => this.pko = bc.bigintToHex(data));

          let json = JSON.parse(JSON.stringify({
            body: body, signature: this.pko,
            pubKey: {e: bc.bigintToHex(this.keyPair.publicKey.e), n: bc.bigintToHex(this.keyPair.publicKey.n)}
          }));

          console.log("All worked fine");
          console.log({
            po: this.po,
            pr: this.pr,
            pko: this.pko
          });

          this.nrTTPService.sendKey(json).subscribe(
            async data => console.log(data));

          this.myWebSocket.asObservable().subscribe(data => console.log(data));

        } else {
          console.log("Bad authentication of proof of reception");
        }
      });
  }
}
