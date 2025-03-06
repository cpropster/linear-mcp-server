import { Issue, Team } from '@linear/sdk';

export interface IssuePayload {
  id: string;
  identifier: string;
  title: string;
  url: string;
  teamId: string;
  _team?: Team;
}

export interface IssueCreateResponse {
  success: boolean;
  issue: IssuePayload;
}

export interface ProjectCreateResponse {
  success: boolean;
  project: {
    id: string;
    name: string;
    url: string;
  };
}

export interface IssueUpdateResponse {
  success: boolean;
  issues: IssuePayload[];
}
