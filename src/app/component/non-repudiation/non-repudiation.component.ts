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
export class NonRepudiationComponent implements OnInit {

  nonRepudiationForm: FormGroup;
  message: string;
  keyPair: rsa.KeyPair;
  cryptoKey;
  key: string;
  algKeyGen;
  algEncrypt;
  keyUsages;
  c: string;
  signature: string;

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
    this.keyPair = await rsa.generateRandomKeys(256);
    console.log(this.keyPair);
    let message = "Test message";
    await crypto.subtle.generateKey(this.algKeyGen,true,this.keyUsages)
      .then(data => this.cryptoKey = data);
    await crypto.subtle.exportKey("raw",this.cryptoKey)
      .then(data => this.key = bc.bufToHex(data));
  }

  async encrypt() {
    this.algEncrypt.iv = await crypto.getRandomValues(new Uint8Array(16));
    await crypto.subtle.encrypt(this.algEncrypt, this.cryptoKey, bc.textToBuf(this.message))
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
