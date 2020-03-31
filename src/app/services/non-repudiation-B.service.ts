import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
/**
 * Non-Repudiation REST API to manage message exchange between A-B
 *
 *
 */
export class NonRepudiationBService {
  /**
   * Server endpoint
   */
  url: string;

  /**
   * Non-Repudiation-B Component constructor
   * @constructor
   * @param {HttpClient} http - HttpClient module
   */
  constructor(private http: HttpClient) {
    this.url = 'http://localhost:50000/nr';
  }

  /**
   * Send first message with proof of origin
   * @param {JSON} json - body + signature
   * @return {JSON} - Received message with proof of reception
   */
  sendMessage(json:JSON): Observable<JSON> {
    return this.http.post<JSON>(this.url + '',json);
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
