import tap from 'tap';
import '../mock/window.ts';
import { bind } from '../index';

let a = { test: '' };
bind(a, 'test');
tap.equal(a.test, 'bound');
