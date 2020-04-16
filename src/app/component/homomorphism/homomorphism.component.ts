import { Component, OnInit } from '@angular/core';
import * as paillier from 'paillier-bigint';
import { NgForm } from '@angular/forms';
import { HomomorphismService } from '../../services/homomorphism.service';
import * as bc from 'bigint-conversion';

@Component({
  selector: 'app-homomorphism',
  templateUrl: './homomorphism.component.html',
  styleUrls: ['./homomorphism.component.css']
})
export class HomomorphismComponent implements OnInit {
  key_n: string;
  key_g: string;

  publicKey;

  privateKey;

  keyPairPallier;


  constructor(public clientService: HomomorphismService) { }

  ngOnInit(): void {
    this.getPublicKeyPailler();
  }

  // Función para obtener la public key de B
  async getPublicKeyPailler() {

    this.keyPairPallier = await paillier.generateRandomKeys(3072);

    this.publicKey = new paillier.PublicKey(
      this.keyPairPallier["publicKey"]["n"],
      this.keyPairPallier["publicKey"]["g"]
    );

    this.privateKey = new paillier.PrivateKey(
      this.keyPairPallier["privateKey"]["lambda"],
      this.keyPairPallier["privateKey"]["mu"],
      this.keyPairPallier["privateKey"]["publicKey"],
      this.keyPairPallier["privateKey"]["_p"],
      this.keyPairPallier["privateKey"]["_q"]
    );

    // this.clientService.getPublicKeyPailler().subscribe(data => {
    //   this.publicKey = new paillier.PublicKey(
    //     bc.hexToBigint(data.n),
    //     bc.hexToBigint(data.g)
    //   );

    //   this.key_g = this.publicKey.g;
    //   this.key_n = this.publicKey.n;
    // });

    console.log(this.publicKey);
    console.log(this.privateKey);
  }



  async sendWords(form: NgForm) {
    console.log("Hola");
    const m1 = bc.textToBigint(form.value.wordOne);
    const m2 = bc.textToBigint(form.value.wordTwo);
    console.log(m1);
    console.log(m2);
    // homomorphic addition of two ciphertexts (encrypted numbers)
    const c1 = this.publicKey.encrypt(m1);
    const c2 = this.publicKey.encrypt(m2);

    const encryptedSum = this.publicKey.addition(c1, c2);
    const messagedecrypted = this.privateKey.decrypt(encryptedSum);
    console.log(bc.bigintToText(messagedecrypted));
    const message = {
      body: bc.bigintToHex(encryptedSum)
    };
    // this.clientService.postHomomorphic(message).subscribe(res => {
    // });
  }


}
