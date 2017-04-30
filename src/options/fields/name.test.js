import log from 'loglevel';
import name from './name';
import { DEFAULT_APP_NAME } from './../../constants';
import { inferTitle } from './../../infer';

jest.mock('./../../infer/inferTitle');
jest.mock('loglevel');

const mockedResult = 'mock name';

describe('well formed name parameters', () => {
  test('it should not call inferTitle', () => {
    expect(inferTitle).toHaveBeenCalledTimes(0);
    const params = { name: 'appname' };
    expect(name(params)).toBe(params.name);
  });
});

describe('bad name parameters', () => {
  describe('when the name is undefined', () => {
    test('it should call inferTitle', () => {
      inferTitle.mockImplementationOnce(() => Promise.resolve(mockedResult));
      const params = { targetUrl: 'some url' };

      return name(params).then(() => {
        expect(inferTitle).toHaveBeenCalledWith(params.targetUrl);
      });
    });
  });

  describe('when the name is an empty string', () => {
    test('it should call inferTitle', () => {
      inferTitle.mockImplementationOnce(() => Promise.resolve(mockedResult));
      const params = { targetUrl: 'some url', name: '' };

      return name(params).then(() => {
        expect(inferTitle).toHaveBeenCalledWith(params.targetUrl);
      });
    });
  });
});

describe('handling inferTitle results', () => {
  const params = { targetUrl: 'some url', name: '' };
  test('it should return the result from inferTitle', () => {
    inferTitle.mockImplementationOnce(() => Promise.resolve(mockedResult));

    return name(params).then((result) => {
      expect(result).toBe(mockedResult);
      expect(inferTitle).toHaveBeenCalledWith(params.targetUrl);
    });
  });

  describe('when the returned pageTitle is falsey', () => {
    test('it should return the default app name', () => {
      inferTitle.mockImplementationOnce(() => Promise.resolve(null));

      return name(params).then((result) => {
        expect(result).toBe(DEFAULT_APP_NAME);
        expect(inferTitle).toHaveBeenCalledWith(params.targetUrl);
      });
    });
  });

  describe('when inferTitle resolves with an error', () => {
    test('it should return the default app name', () => {
      inferTitle.mockImplementationOnce(() => Promise.reject('some error'));

      return name(params).then((result) => {
        expect(result).toBe(DEFAULT_APP_NAME);
        expect(inferTitle).toHaveBeenCalledWith(params.targetUrl);
        expect(log.warn).toHaveBeenCalledTimes(1);
      });
    });
  });
});

