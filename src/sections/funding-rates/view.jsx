'use client';

import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Unstable_Grid2';

import { useEffect, useState, useCallback, useRef } from 'react';

import { Table, TableRow, TableCell, TableBody, TableContainer, Paper } from '@mui/material';

import { TableHeadCustom } from 'src/components/table';

import { toast } from 'src/components/snackbar';

import { useUser } from "@auth0/nextjs-auth0/client";
import axiosInstance from 'src/utils/axios-with-auth';

import { DashboardContent } from 'src/layouts/dashboard';

import { AppWelcome } from 'src/sections/dashboard/app-welcome';
import { splitFieldInternalAndForwardedProps } from '@mui/x-date-pickers/internals';

import { ChartPie } from './components/chart-pie';
 
// ----------------------------------------------------------------------

export function FundingRateView() {
  const { user, isLoading: userLoading } = useUser();
  const [walletBalances, setWalletBalances] = useState([
    { balance_id: 1, exchange: "Loading...", market: "Loading...", balance: "-" },
  ]);
  const [chartData, setChartData] = useState();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const hasInitLoaded = useRef(false);
  useEffect(() => {
    if (user && !userLoading && !hasInitLoaded.current) {
      hasInitLoaded.current = true;
      setIsLoading(true);
      axiosInstance.get('test/')
        .then(response => {
          setWalletBalances(response.data.positions);
          if(response.data.important_update){
            toast.success(response.data.important_update_text);
          }
          const chartData = {
            balances: [],
            markets: []
          }
          response.data.positions.forEach(position => {
            chartData.balances.push(Number(position.balance))
            chartData.markets.push(position.market)
          })
          setChartData(chartData)



          setError(null);
        })
        .catch(error => {
          setError(error);
          console.log("Error: ",error);

          toast.error(error.response.data.detail);
          setWalletBalances(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [user, userLoading]);

  const theme = useTheme();

  const TABLE_HEAD = [
    { id: 'exchange', label: 'Exchange' },
    { id: 'market', label: 'Coin/Asset' },
    { id: 'balance', label: 'Balance', align: 'right' }
  ];

  return (
    <DashboardContent maxWidth="xl">
      <Grid container spacing={3}>
        <Grid xs={12} md={12}>
          <AppWelcome
            title="Your mother is a funding rate"
            description="May the spreads be wide and the market books deep."
          />
        </Grid>

        <Grid xs={12} lg={12}>
            <ChartPie
                chart={{
                series: chartData?.balances || [],
                categories: chartData?.markets || [],
                }}
            />
        </Grid>

       
        <Grid xs={12} lg={12}>
        <TableContainer component={Paper} sx={{ maxWidth: '100%', overflowX: 'auto' }}>
          <Table sx={{ minWidth: 400 }}>
            <TableHeadCustom headLabel={TABLE_HEAD} />

            <TableBody>
            {walletBalances?.map((row) => (
                <TableRow key={row.balance_id}>
                <TableCell>{row.exchange}</TableCell>
                <TableCell>{row.market}</TableCell>
                <TableCell align="right">{row.balance}</TableCell>
                </TableRow>
            ))}
            </TableBody>
        </Table>
        </TableContainer>
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
