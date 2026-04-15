import { defineAction } from 'astro:actions';
import { inquiry } from './inquiry';
import { comment } from './comment';
import { test } from './test';

export const server = {
  inquiry,
  comment,
  test
};
