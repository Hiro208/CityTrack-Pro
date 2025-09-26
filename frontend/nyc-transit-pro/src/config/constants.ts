// src/config/constants.ts
import type { TerminalMapType } from '../types/transit';

// 1. 线路颜色定义 (MTA 标准色)
export const ROUTE_COLORS: Record<string, string> = {
  '1': '#EE352E', '2': '#EE352E', '3': '#EE352E',
  '4': '#00933C', '5': '#00933C', '6': '#00933C',
  '7': '#B933AD', '7X': '#B933AD',
  'A': '#0039A6', 'C': '#0039A6', 'E': '#0039A6',
  'B': '#FF6319', 'D': '#FF6319', 'F': '#FF6319', 'M': '#FF6319',
  'G': '#6CBE45',
  'J': '#996633', 'Z': '#996633',
  'L': '#A7A9AC',
  'N': '#FCCC0A', 'Q': '#FCCC0A', 'R': '#FCCC0A', 'W': '#FCCC0A',
  'S': '#808183', 'GS': '#808183', 'FS': '#808183', 'H': '#808183',
  'SI': '#0039A6'
};

// 2. 终点站字典 (用于将 N/S 翻译成人话)
export const TERMINAL_MAP: TerminalMapType = {
  // IRT (数字线)
  '1': { 'N': { term: 'Van Cortlandt Park', dir: 'Uptown' }, 'S': { term: 'South Ferry', dir: 'Downtown' } },
  '2': { 'N': { term: 'Wakefield-241 St', dir: 'Uptown' }, 'S': { term: 'Flatbush Av', dir: 'Downtown' } },
  '3': { 'N': { term: 'Harlem-148 St', dir: 'Uptown' }, 'S': { term: 'New Lots Av', dir: 'Downtown' } },
  '4': { 'N': { term: 'Woodlawn', dir: 'Uptown' }, 'S': { term: 'Utica Av', dir: 'Downtown' } },
  '5': { 'N': { term: 'Dyre Av', dir: 'Uptown' }, 'S': { term: 'Flatbush Av', dir: 'Downtown' } },
  '6': { 'N': { term: 'Pelham Bay Park', dir: 'Uptown' }, 'S': { term: 'Brooklyn Bridge', dir: 'Downtown' } },
  '7': { 'N': { term: 'Flushing-Main St', dir: 'Queens-bound' }, 'S': { term: '34 St-Hudson Yds', dir: 'Manhattan-bound' } },

  // IND/BMT (字母线)
  'A': { 'N': { term: 'Inwood-207 St', dir: 'Uptown' }, 'S': { term: 'Far Rockaway', dir: 'Downtown' } },
  'C': { 'N': { term: '168 St', dir: 'Uptown' }, 'S': { term: 'Euclid Av', dir: 'Downtown' } },
  'E': { 'N': { term: 'Jamaica Center', dir: 'Queens-bound' }, 'S': { term: 'World Trade Ctr', dir: 'Manhattan-bound' } },
  'B': { 'N': { term: 'Bedford Park Blvd', dir: 'Uptown' }, 'S': { term: 'Brighton Beach', dir: 'Downtown' } },
  'D': { 'N': { term: 'Norwood-205 St', dir: 'Uptown' }, 'S': { term: 'Coney Island', dir: 'Downtown' } },
  'F': { 'N': { term: 'Jamaica-179 St', dir: 'Queens-bound' }, 'S': { term: 'Coney Island', dir: 'Brooklyn-bound' } },
  'M': { 'N': { term: 'Forest Hills', dir: 'Queens-bound' }, 'S': { term: 'Middle Village', dir: 'Brooklyn-bound' } },
  'G': { 'N': { term: 'Court Sq', dir: 'Queens-bound' }, 'S': { term: 'Church Av', dir: 'Brooklyn-bound' } },
  'J': { 'N': { term: 'Jamaica Center', dir: 'Queens-bound' }, 'S': { term: 'Broad St', dir: 'Manhattan-bound' } },
  'Z': { 'N': { term: 'Jamaica Center', dir: 'Queens-bound' }, 'S': { term: 'Broad St', dir: 'Manhattan-bound' } },
  'L': { 'N': { term: 'Canarsie', dir: 'Brooklyn-bound' }, 'S': { term: '8 Av', dir: 'Manhattan-bound' } },
  'N': { 'N': { term: 'Astoria', dir: 'Queens-bound' }, 'S': { term: 'Coney Island', dir: 'Brooklyn-bound' } },
  'Q': { 'N': { term: '96 St', dir: 'Uptown' }, 'S': { term: 'Coney Island', dir: 'Downtown' } },
  'R': { 'N': { term: 'Forest Hills', dir: 'Queens-bound' }, 'S': { term: 'Bay Ridge', dir: 'Brooklyn-bound' } },
  'W': { 'N': { term: 'Astoria', dir: 'Queens-bound' }, 'S': { term: 'Whitehall St', dir: 'Manhattan-bound' } },
  'SI': { 'N': { term: 'St. George', dir: 'Northbound' }, 'S': { term: 'Tottenville', dir: 'Southbound' } }
};