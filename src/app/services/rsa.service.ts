import { Injectable } from '@angular/core';
import { } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import {Observable, Subject} from 'rxjs';
import * as rsa from 'rsa';
import {HexBase64BinaryEncoding} from "crypto";

@Injectable({
  providedIn: 'root'
})
export class RsaService {

  url: string;

  constructor(private http: HttpClient) {
    this.url = 'http://localhost:3000/';
  }

  getPublicKey(): Observable<rsa.PublicKey> {
    return this.http.get<rsa.PublicKey>(this.url + 'pubKey');
  }

  signMessage (message:string) : Observable<any> {
      return this.http.post<any>(this.url + 'sign',{message:message});
  }

  checkClearText (crypto:HexBase64BinaryEncoding) : Observable<any>{
    return this.http.post<any>(this.url + 'decrypt',{crypto:crypto});
  }
}
