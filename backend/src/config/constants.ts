// src/config/constants.ts

export interface TerminalInfo {
  term: string;
  dir: string;
}

export type TerminalMapType = {
  [key: string]: {
    N: TerminalInfo;
    S: TerminalInfo;
  };
};

// 包含所有线路的完整字典
export const TERMINAL_MAP: TerminalMapType = {
  // --- IRT Numbered Lines (1-7) ---
  '1': { 'N': { term: '242 St-Van Cortlandt Pk', dir: 'Uptown' }, 'S': { term: 'South Ferry', dir: 'Downtown' } },
  '2': { 'N': { term: 'Wakefield-241 St', dir: 'Uptown' }, 'S': { term: 'Flatbush Av-Brooklyn College', dir: 'Downtown' } },
  '3': { 'N': { term: 'Harlem-148 St', dir: 'Uptown' }, 'S': { term: 'New Lots Av', dir: 'Downtown' } },
  '4': { 'N': { term: 'Woodlawn', dir: 'Uptown' }, 'S': { term: 'Utica Av / Crown Hts', dir: 'Downtown' } },
  '5': { 'N': { term: 'Eastchester-Dyre Av', dir: 'Uptown' }, 'S': { term: 'Flatbush Av', dir: 'Downtown' } },
  '6': { 'N': { term: 'Pelham Bay Park', dir: 'Uptown' }, 'S': { term: 'Brooklyn Bridge-City Hall', dir: 'Downtown' } },
  '7': { 'N': { term: 'Flushing-Main St', dir: 'Eastbound' }, 'S': { term: '34 St-Hudson Yards', dir: 'Westbound' } },

  // --- IND/BMT Lettered Lines (A-G, L) ---
  'A': { 'N': { term: 'Inwood-207 St', dir: 'Uptown' }, 'S': { term: 'Far Rockaway / Lefferts Blvd', dir: 'Downtown' } },
  'C': { 'N': { term: '168 St', dir: 'Uptown' }, 'S': { term: 'Euclid Av', dir: 'Downtown' } },
  'E': { 'N': { term: 'Jamaica Center', dir: 'Queens-bound' }, 'S': { term: 'World Trade Center', dir: 'Manhattan-bound' } },
  'G': { 'N': { term: 'Court Sq', dir: 'Queens-bound' }, 'S': { term: 'Church Av', dir: 'Brooklyn-bound' } },
  'L': { 'N': { term: 'Canarsie-Rockaway Pkwy', dir: 'Eastbound' }, 'S': { term: '8 Av', dir: 'Westbound' } },

  // --- B Division (B, D, F, M) ---
  'B': { 'N': { term: 'Bedford Park Blvd', dir: 'Uptown' }, 'S': { term: 'Brighton Beach', dir: 'Downtown' } },
  'D': { 'N': { term: 'Norwood-205 St', dir: 'Uptown' }, 'S': { term: 'Coney Island', dir: 'Downtown' } },
  'F': { 'N': { term: 'Jamaica-179 St', dir: 'Queens-bound' }, 'S': { term: 'Coney Island', dir: 'Brooklyn-bound' } },
  'M': { 'N': { term: 'Forest Hills-71 Av', dir: 'Queens-bound' }, 'S': { term: 'Middle Village-Metropolitan Av', dir: 'Brooklyn-bound' } },

  // --- J/Z Lines ---
  'J': { 'N': { term: 'Jamaica Center', dir: 'Queens-bound' }, 'S': { term: 'Broad St', dir: 'Manhattan-bound' } },
  'Z': { 'N': { term: 'Jamaica Center', dir: 'Queens-bound' }, 'S': { term: 'Broad St', dir: 'Manhattan-bound' } },

  // --- N, Q, R, W Lines ---
  'N': { 'N': { term: 'Astoria-Ditmars Blvd', dir: 'Queens-bound' }, 'S': { term: 'Coney Island', dir: 'Brooklyn-bound' } },
  'Q': { 'N': { term: '96 St', dir: 'Uptown' }, 'S': { term: 'Coney Island', dir: 'Downtown' } },
  'R': { 'N': { term: '71 Av-Forest Hills', dir: 'Queens-bound' }, 'S': { term: 'Bay Ridge-95 St', dir: 'Brooklyn-bound' } },
  'W': { 'N': { term: 'Astoria-Ditmars Blvd', dir: 'Queens-bound' }, 'S': { term: 'Whitehall St', dir: 'Manhattan-bound' } }, // W 线经常变动，这是目前的标准
  
  // --- Staten Island Railway (SIR) ---
  'SI': { 'N': { term: 'St. George', dir: 'Northbound' }, 'S': { term: 'Tottenville', dir: 'Southbound' } }
};

// API 列表保持不变，但我还是列在这里方便你对照
export const FEED_URLS = [
  'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs',      // 1,2,3,4,5,6,S
  'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace',  // A,C,E
  'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm', // B,D,F,M
  'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-g',    // G
  'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-jz',   // J,Z
  'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-nqrw', // N,Q,R,W
  'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-l',    // L
  'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-si'    // SIR
];