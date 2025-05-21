# Lyrics and Chords Editor
![msedge_b8BEuKT5Nu](https://github.com/user-attachments/assets/7c175bd9-5d2a-4258-a65c-e549ea9b1ca2)

A React application for editing song lyrics with chord annotations.
## Buy me a pizza 
https://www.paypal.com/donate/?hosted_button_id=JR45EMHSW7YAL


## Features

- Add chords to lyrics by clicking positions
- Save and load tabs
- Export to PDF
- Responsive design

## Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Start dev server: `npm run dev`

## Docker Deployment

1. Build the image: `docker build -t lyrics-chords-editor .`
2. Run the container: `docker run -p 3000:80 lyrics-chords-editor`

Or using docker-compose:

```bash
docker-compose up
```

## Environment Variables

None required for basic functionality.

## License

MIT
