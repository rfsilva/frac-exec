import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, of } from 'rxjs';

export interface CompanyRegistrationRequest {
  legalName:          string;
  cnpj:               string;
  sector:             string;
  employeeRange:      string;
  annualRevenueRange: string;
  responsibleName:    string;
  responsibleEmail:   string;
}

export interface CompanyRegistrationResponse {
  companyId: string;
  message:   string;
}

export interface NeedRequest {
  cLevelType:           string;
  scopeDaysPerMonth:    string;
  estimatedDuration?:   string;
  desiredStart?:        string;
  challengeDescription: string;
  expectedResult:       string;
  confidentialContext?: string;
}

export interface NeedResponse {
  id:                  string;
  cLevelType:          string;
  scopeDaysPerMonth:   string;
  estimatedDuration:   string | null;
  desiredStart:        string | null;
  challengeDescription:string;
  expectedResult:      string;
  status:              string;
  createdAt:           string;
  slaDeadline:         string;
}

export interface DashboardResponse {
  companyName:   string;
  companyStatus: string;
  activeNeed:    NeedResponse | null;
}

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private readonly http = inject(HttpClient);

  register(req: CompanyRegistrationRequest): Observable<CompanyRegistrationResponse> {
    return this.http.post<CompanyRegistrationResponse>('/api/v1/companies/register', req);
  }

  postNeed(req: NeedRequest): Observable<NeedResponse> {
    return this.http.post<NeedResponse>('/api/v1/company/needs', req);
  }

  saveDraft(req: NeedRequest): Observable<NeedResponse> {
    return this.http.post<NeedResponse>('/api/v1/company/needs/draft', req);
  }

  getDashboard(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>('/api/v1/company/dashboard');
  }

  getActiveNeed(): Observable<NeedResponse | null> {
    return this.http.get<NeedResponse>('/api/v1/company/needs/active').pipe(
      catchError(() => of(null))
    );
  }
}
