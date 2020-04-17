import { Component, OnInit } from '@angular/core';
import * as paillier from 'paillier-bigint';
import { NgForm } from '@angular/forms';
import { HomomorphismService } from '../../services/homomorphism.service';
import * as bc from 'bigint-conversion';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';


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

  /**
   * Counter of votes for each contestant
   */
  votesA = 0;
  votesB = 0;
  votesC = 0;

  /**
   * List of encrypted votes
   */
  listAllVotes: Array<bigint> = [];

  /**
   * To know if the button is clicked in order to show the results
   */
  clicked = false;

  /**
   * The final result of the encrypted votes
   */
  totalDecrypted = BigInt(1);


  /**
   * Homomorphic poll Form to manage messages
   * @name homomorphicForm
   * @type {FormGroup}
   */
  pollForm: FormGroup;

  /**
   *
   * @param clientService
   * @param formBuilder
   */
  constructor(public clientService: HomomorphismService, private formBuilder: FormBuilder) {
    this.pollForm = this.formBuilder.group({});
  }

  ngOnInit(): void {
    this.getPublicKeyPailler();
  }

  // Función para obtener la public key de B
  async getPublicKeyPailler() {

    this.keyPairPallier = await paillier.generateRandomKeys(512);

    this.publicKey = new paillier.PublicKey(
      this.keyPairPallier["publicKey"]["n"],
      this.keyPairPallier["publicKey"]["g"]
    );

    this.privateKey = new paillier.PrivateKey(
      this.keyPairPallier["privateKey"]["lambda"],
      this.keyPairPallier["privateKey"]['mu'],
      this.keyPairPallier["privateKey"]['publicKey'],
      this.keyPairPallier["privateKey"]['_p'],
      this.keyPairPallier["privateKey"]['_q']
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

  async voteA() {
    this.votesA++;
    const A = BigInt(100);
    const encryptedA = await this.publicKey.encrypt(A);
    this.listAllVotes.push(encryptedA);
    console.log(this.listAllVotes);
  }

  async voteB() {
    this.votesB++;
    const B = BigInt(10);
    const encryptedB = await this.publicKey.encrypt(B);
    this.listAllVotes.push(encryptedB);
    console.log(this.listAllVotes);
  }

  async voteC() {
    this.votesC++;
    const C = BigInt(1);
    const encryptedC = await this.publicKey.encrypt(C);
    this.listAllVotes.push(encryptedC);
    console.log(this.listAllVotes);
  }

  async recountVotes() {
    this.clicked = true;
    let totalEncrypted = BigInt(1);
    for (let i in this.listAllVotes) {
      totalEncrypted = this.publicKey.addition(this.listAllVotes[i], totalEncrypted);
    }
    console.log(this.privateKey.decrypt(totalEncrypted));
    this.totalDecrypted = this.privateKey.decrypt(totalEncrypted);
    document.getElementById('recountVotes').style.display = 'none';
  }

  async sendWords(form: NgForm) {
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
