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
      this.clientService.getPublicKeyPailler().subscribe(data => {
       this.publicKey = new paillier.PublicKey(
         bc.hexToBigint(data.n),
         bc.hexToBigint(data.g)
       );
       console.log(this.publicKey);
     });
  }

  async voteA() {
    this.votesA++;
    const A = BigInt(100);
    const encryptedA = await this.publicKey.encrypt(A);
    this.listAllVotes.push(encryptedA);
    console.log('List encrypted votes: ', this.listAllVotes);
  }

  async voteB() {
    this.votesB++;
    const B = BigInt(10);
    const encryptedB = await this.publicKey.encrypt(B);
    this.listAllVotes.push(encryptedB);
    console.log('List encrypted votes: ', this.listAllVotes);
  }

  async voteC() {
    this.votesC++;
    const C = BigInt(1);
    const encryptedC = await this.publicKey.encrypt(C);
    this.listAllVotes.push(encryptedC);
    console.log('List encrypted votes: ', this.listAllVotes);
  }

  async recountVotes() {
    this.clicked = true;
    let totalEncrypted = BigInt(1);
    for (let i in this.listAllVotes) {
      totalEncrypted = await this.publicKey.addition(this.listAllVotes[i], totalEncrypted);
    }
    console.log('Sum encrypted votes');
    console.log(totalEncrypted);
    const message = {
      totalEncrypted: bc.bigintToHex(totalEncrypted)
    }
    this.clientService.postHomomorphic(message).subscribe(res => {
      this.totalDecrypted = bc.hexToBigint(res.msg);
      const votes = ("00" + this.totalDecrypted).slice(-3);
      console.log('Sum votes: ' + votes);
      const digits = this.totalDecrypted.toString().split('');
      console.log('Votes A: ' + digits[0]);
      console.log('Votes B: ' + digits[1]);
      console.log('Votes C: ' + digits[2]);
      document.getElementById('recountVotes').style.display = 'none';
    });
  }
}
