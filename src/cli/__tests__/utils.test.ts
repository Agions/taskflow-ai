/**
 * CLI Utils Tests
 * TaskFlow AI v4.0
 */

import { Spinner } from '../utils';

// Mock chalk to avoid console output
jest.mock('chalk', () => ({
  default: {
    cyan: (text: string) => text,
    green: (text: string) => text,
    red: (text: string) => text,
    yellow: (text: string) => text,
    gray: (text: string) => text,
    bold: (text: string) => text,
  },
}));

describe('Spinner', () => {
  let spinner: Spinner;

  beforeEach(() => {
    spinner = new Spinner();
    jest.spyOn(process.stdout, 'write').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should start and stop spinner successfully', (done) => {
    spinner.start('Loading...');

    setTimeout(() => {
      spinner.stop(true);
      expect(process.stdout.write).toHaveBeenCalled();
      done();
    }, 200);
  });

  it('should stop with failure state', (done) => {
    spinner.start('Processing...');

    setTimeout(() => {
      spinner.stop(false);
      expect(process.stdout.write).toHaveBeenCalled();
      done();
    }, 200);
  });
});
