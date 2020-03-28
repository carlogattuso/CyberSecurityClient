import { Component, OnInit } from '@angular/core';
import { RsaService } from '../../services/rsa.service';
import * as rsa from 'rsa';
import * as bc from 'bigint-conversion';
import * as bcu from 'bigint-crypto-utils';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {HexBase64BinaryEncoding} from "crypto";
import {bitLength} from "bigint-crypto-utils";

@Component({
  selector: 'app-blind-signature',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  // General variables
  _ONE:BigInt = BigInt(1);
  publicKey: rsa.PublicKey;

  // BlindSignatureVariables
  blindSignatureForm: FormGroup;
  message:string;
  blindMessage: HexBase64BinaryEncoding;
  blindSignature: HexBase64BinaryEncoding;
  clearText: string;
  r: bigint;
  b: bigint;
  s: bigint;

  // SignatureVariables
  signatureForm: FormGroup;
  stdMessage: string;
  stdSignature: HexBase64BinaryEncoding;
  stdClearText: string;

  // DecryptVariables
  decryptForm: FormGroup;
  messageToEncrypt: string;
  encryptedMessage: HexBase64BinaryEncoding;
  decryptedClearText: string;

  constructor(private rsaService: RsaService, private formBuilder: FormBuilder) {
    this.blindSignatureForm = this.formBuilder.group({
      blindMessage: new FormControl('', Validators.required),
    });
    this.signatureForm = this.formBuilder.group({
      stdMessage: new FormControl('', Validators.required),
    });
    this.decryptForm = this.formBuilder.group({
      messageToEncrypt: new FormControl('', Validators.required),
    });
  }

  async ngOnInit() {
    this.rsaService.getPublicKey().subscribe(
      data => {
        this.publicKey = new rsa.PublicKey(bc.hexToBigint(data.e), bc.hexToBigint(data.n));
      }
    );
  }

  async getSignature(){
    this.rsaService.signMessage(bc.bigintToHex(bc.textToBigint(this.stdMessage))).subscribe(
      data => {
        this.stdSignature = data.signature;
        this.stdClearText = bc.bigintToText(this.publicKey.verify(bc.hexToBigint(this.stdSignature)));
        document.getElementById('signature').innerHTML = this.stdMessage as string;
        document.getElementById('blind-clear-text').innerHTML = this.stdClearText as string;
      }
    );
  }

  async blindSign() {
    do {
      this.r = await bcu.prime(bcu.bitLength(this.publicKey.n));
    }
    while (!(bcu.gcd(this.r,this.publicKey.n) === this._ONE));
    this.b = await (bc.textToBigint(this.message)*this.publicKey.encrypt(this.r))%this.publicKey.n;
    this.blindMessage = await bc.bigintToHex(this.b);
    this.rsaService.signMessage(this.blindMessage).subscribe(
      async data => {
        this.blindSignature = await data.signature;
        this.s = await (bc.hexToBigint(this.blindSignature)*bcu.modInv(this.r, this.publicKey.n))%this.publicKey.n;
        this.clearText = await bc.bigintToText(this.publicKey.verify(this.s));
        document.getElementById('blind-message').innerHTML = this.blindMessage as string;
        document.getElementById('blind-signature').innerHTML = this.blindSignature as string;
        document.getElementById('blind-clear-text').innerHTML = this.clearText as string;
      }
    );
  }

  async getClearText() {
    this.encryptedMessage = await bc.bigintToHex(this.publicKey.encrypt(bc.textToBigint(this.messageToEncrypt)));
    document.getElementById('crypto-message').innerHTML = this.encryptedMessage as string;
    this.rsaService.checkClearText(this.encryptedMessage).subscribe(
      data => {
        this.decryptedClearText = bc.bigintToText(bc.hexToBigint(data.clearText));
        document.getElementById('crypto-clear-text').innerHTML = this.decryptedClearText as string;
      }
    );
  }
}
