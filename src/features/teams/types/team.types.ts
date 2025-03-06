/**
 * Team operation types
 */

export interface TeamState {
  id: string;
  name: string;
  type: string;
}

export interface Team {
  id: string;
  name: string;
  key: string;
  states: TeamState[];
}

export interface TeamResponse {
  teams: {
    nodes: Team[];
  };
}

export interface LabelInput {
  name: string;
  color?: string;
  teamId: string;
}

export interface LabelResponse {
  labelCreate: {
    success: boolean;
    label: {
      id: string;
      name: string;
    };
  };
}
