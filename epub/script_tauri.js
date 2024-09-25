import { open } from '@tauri-apps/plugin-dialog';

async function tauri_pickfile(){
    const file = await open({
        multiple: false,
        directory: true,
      });
      console.log(file);
}