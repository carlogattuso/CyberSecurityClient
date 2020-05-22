import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
/**
 * Homomorphism REST API to manage message exchange between A-B
 *
 *
 */
export class HomomorphismService {
  /**
   * Server endpoint
   */
  url: string;

  wordOne: string;
  wordTwo: string;

  /**
   * Homorphism Component constructor
   * @constructor
   * @param {HttpClient} http - HttpClient module
   */
  constructor(private http: HttpClient) {
    this.url = 'http://localhost:50000/paillier';
  }
  /**
  * Server's public key in stringHex
  * @return {stringHex}
  */
  getPublicKeyPailler(): Observable<any> {
    return this.http.get<any>(this.url + '/pubKey');
  }

  /**
   * Service to to send the homomorphic message
   * @param {body} body - message
   */
  postHomomorphic(body: object): Observable<any> {
  return this.http.post<any>(this.url + '/decrypt', body);
  }

}
