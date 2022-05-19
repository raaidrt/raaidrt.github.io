import { ThemeProvider, createTheme } from '@mui/material/styles';
import React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';
import ArticleIcon from '@mui/icons-material/Article';
import './App.css'

const font = "'Open Sans', sans-serif";

const darkTheme = createTheme({
  palette: {
	mode: 'dark'
  }, 
  typography: {
	fontFamily: font
  },
  root: {
    minWidth: "100%",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center"
  },
});

function App() {

	return (<React.Fragment><ThemeProvider theme={darkTheme}>
	<CssBaseline />
	<Box display="flex" direction="column" alignItems="center" justifyContent="center">
	<Grid container spacing={2} 
		sx={{p:22}}
		direction="column"
		alignItems="center"
		justifyContent="center">
		<Grid item xs={3}>
			<Avatar style={{height:100, width:100}} alt="Raaid Tanveer" src="https://media-exp1.licdn.com/dms/image/C5603AQHTtZDi06ELlA/profile-displayphoto-shrink_800_800/0/1609047418453?e=1658361600&v=beta&t=h5Xteii0VBT-wIbSPNqIQ7cmLT7RwRv9si7KgTLUnp4"/>
		</Grid>
		<Grid item xs={9}>
			<Typography variant="h2" display="inline" gutterBottom noWrap>
				Raaid Tanveer
			</Typography>
		</Grid>
		<Grid item xs={12}>
			<Stack direction="row" spacing={2}>
				<GitHubIcon style={{height:40, width:40}} onClick={() => {
					window.location.href = "https://github.com/raaidrt";
				}} />
				<LinkedInIcon style={{height:40, width:40}} onClick={() => {
					window.location.href = "https://www.linkedin.com/in/raaid-raiyan-tanveer-292b791aa/";
				}}/>
				<ArticleIcon style={{height:40, width:40}} onClick={() => {
					window.location.href = "https://drive.google.com/file/d/1U4wTuMUrRSw0VDDb9yoUpY4QzJGJJCzQ/view?usp=sharing"
				}}/>
				<InstagramIcon style={{height:40, width:40}} onClick={() => {
					window.location.href = "https://www.instagram.com/raaid.rt/";
				}}/>
			</Stack>
		</Grid>
	</Grid>
	</Box>
	</ThemeProvider></React.Fragment>);
}

export default App;
