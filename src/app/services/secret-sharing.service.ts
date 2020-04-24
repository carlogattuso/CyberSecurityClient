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
 * Shamir's Secret Sharing REST API to test security protocol
 *
 *
 */
export class SecretSharingService {
  /**
   * Server endpoint
   */
  url: string;

  /**
   * SecretSharingService constructor
   * @constructor
   * @param {HttpClient} http - HttpClient module
   */
  constructor(private http: HttpClient) {
    this.url = 'http://localhost:50000/ss/';
  }

  /**
   * Secret key slices in stringHex
   * @return {stringHex[]}
   */
  getSlices(): Observable<any> {
    return this.http.get<any>(this.url + 'slices');
  }

  /**
   * Service to add a slice to secret and get current recovered one
   * @param {string} slice - add slice to recover secret
   * @return {stringHex} - current recovered secret
   */
  sendSlice (slice:string) : Observable<any> {
    return this.http.post<any>(this.url + 'combine',{slice:slice});
  }
}
