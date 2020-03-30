import { Injectable } from '@angular/core';
import { } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import {Observable, Subject} from 'rxjs';
import * as rsa from 'rsa';
import {HexBase64BinaryEncoding} from "crypto";

@Injectable({
  providedIn: 'root'
})
/**
 * RSA REST API to manage message exchange between A-B and A-TTP
 *
 *
 */
export class RsaService {
  /**
   * Server endpoint
   */
  url: string;

  /**
   * Non-Repudiation Component constructor
   * @constructor
   * @param {HttpClient} http - HttpClient module
   */
  constructor(private http: HttpClient) {
    this.url = 'http://localhost:50000/';
  }

  /**
   * Server's public key in stringHex
   * @return {stringHex}
   */
  getPublicKey(): Observable<any> {
    return this.http.get<any>(this.url + 'pubKey');
  }

  /**
   * Service to sign any string using server's private key
   * @param {string} message - message to sign
   * @return {stringHex} - signature in stringHex
   */
  signMessage (message:string) : Observable<any> {
      return this.http.post<any>(this.url + 'sign',{message:message});
  }

  /**
   * Service to sign any string using server's private key
   * @param {stringHex} crypto - encrypted message to send
   * @return {stringHex} - clearText to verify that rsa is working
   */
  checkClearText (crypto:string) : Observable<any>{
    return this.http.post<any>(this.url + 'decrypt',{crypto:crypto});
  }
}
