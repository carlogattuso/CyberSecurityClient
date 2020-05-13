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
}
