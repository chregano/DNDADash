import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import axiosInstance from 'src/utils/axios-with-auth';

function PortfolioOverview({ onPortfolioChange }) {
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState('');

  useEffect(() => {
    fetchUserPortfolios();
  }, []);

  const fetchUserPortfolios = async () => {
    try {
      const response = await axiosInstance.get('/userPortfolios');
      setPortfolios(response.data.portfolios);
      if (response.data.portfolios.length > 0) {
        setSelectedPortfolio(response.data.portfolios[0].portfolio_id);
        onPortfolioChange(response.data.portfolios[0].portfolio_id);
      }
    } catch (error) {
      console.error('Error fetching user portfolios:', error);
    }
  };

  const handlePortfolioChange = (event) => {
    setSelectedPortfolio(event.target.value);
    onPortfolioChange(event.target.value);
  };

  return (
    <Box className="portfolio-overview">
      <Box className="portfolio-selector" sx={{ width: '100%', marginBottom: '20px' }}>
        <FormControl fullWidth>
          <Select
            value={selectedPortfolio}
            onChange={handlePortfolioChange}
            displayEmpty
            inputProps={{ 'aria-label': 'Select a portfolio' }}
          >
            <MenuItem value="" disabled>
              Select a portfolio
            </MenuItem>
            {portfolios.map((portfolio) => (
              <MenuItem key={portfolio.portfolio_id} value={portfolio.portfolio_id}>
                {portfolio.portfolio_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
}

export default PortfolioOverview;
