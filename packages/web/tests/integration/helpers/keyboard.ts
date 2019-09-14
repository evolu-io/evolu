// NOTE, on MacOS, keyboard shortcuts like ⌘ A -> Select All do not work. See #1313
// https://github.com/GoogleChrome/puppeteer/issues/1313
// tldr; We can not use ⌘ for anything, not even for moving to line / page ends, etc.
// Meta works only in Linux and Windows and there are also different shortcuts.
// We rely on native text writing and selection anyway, because that's what
// contentEditable does well. If not, add platform and browser-specific test.
// Therefore, for key navigation, we use arrows only.
// There will be platform dependent edge cases among elements etc. That's fine.

export async function pressMany(key: string, count: number) {
  for (let i = 0; i < count; i++) {
    await page.keyboard.press(key);
    // Waiting after key press is necessary, otherwise, Puppeteer will fail.
    await page.waitFor(50);
  }
}

// TODO: Wrapper which will add waitFor 50 automatically.
