import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
/**
 * Non-Repudiation REST API to manage message exchange between A-TTP
 *
 *
 */
export class NonRepudiationTTPService {
  /**
   * Server endpoint
   */
  url: string;

  /**
   * Non-Repudiation-TTP Component constructor
   * @constructor
   * @param {HttpClient} http - HttpClient module
   */
  constructor(private http: HttpClient) {
    this.url = 'http://localhost:50001/nr';
  }

  /**
   * Send message with key and proof of key origin
   * @param {JSON} json - body + signature
   * @return {JSON} - Received message with proof of key publication
   */
  sendKey(json:JSON): Observable<JSON> {
    return this.http.post<JSON>(this.url + '',json);
  }
}
