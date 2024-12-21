'use client';

import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Unstable_Grid2';

import { useEffect, useState, useCallback, useRef } from 'react';

import {
  Table, TableRow, TableCell, TableBody, TableContainer, Paper,
  Collapse, IconButton, Typography, Box, TableHead
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

import { TableHeadCustom } from 'src/components/table';
import { Chart, useChart } from 'src/components/chart';


import { toast } from 'src/components/snackbar';

import { useUser } from "@auth0/nextjs-auth0/client";
import axiosInstance, { createAuthenticatedWebSocket } from 'src/utils/axios-with-auth';

import { DashboardContent } from 'src/layouts/dashboard';

import { AppWelcome } from 'src/sections/dashboard/app-welcome';
import { AppWidgetSummary } from 'src/sections/dashboard/app-widget-summary';
import PortfolioOverview from 'src/components/Dashboard/PortfolioOverview';

// ----------------------------------------------------------------------

const TRANSFERS_TABLE_HEAD = [
  { id: 'transfer_id', label: 'Transfer ID' },
  { id: 'from_exchange', label: 'From Exchange' },
  { id: 'to_exchange', label: 'To Exchange' },
  { id: 'amount', label: 'Amount' },
  { id: 'total_fees', label: 'Total Fees' },
  { id: 'transfer_state', label: 'Transfer State' },
  { id: 'timestamp', label: 'Timestamp' },
];

const ORDERS_TABLE_HEAD = [
  { id: 'order_id', label: 'Order ID' },
  { id: 'exchange', label: 'Exchange' },
  { id: 'symbol', label: 'Symbol' },
  { id: 'side', label: 'Side' },
  { id: 'size', label: 'Size' },
  { id: 'price', label: 'Price' },
  { id: 'order_status', label: 'Status' },
  { id: 'timestamp', label: 'Timestamp' },
];

export function DashboardView() {
  const { user, isLoading: userLoading } = useUser();

  const defaultTrade = {
    exchange: "Loading...",
    symbol: "Loading...",
    size: "Loading...",
    side: "Loading...",
    entry_price: "Loading...",
    current_price: "Loading...",
    liquidation_price: "Loading...",
    exit_price: "Loading...",
    leverage: "Loading...",
    pnl: "Loading...",
    cum_funding: "Loading..."
  };
  const [trades, setTrades] = useState([
    defaultTrade
  ]);
  const [balances, setBalances] = useState([
    { balance_id: 1, exchange: "Loading...", equity: "Loading...", free_colato: "Loading...", side: "Loading...", entry_price: "Loading...", exit_price: "Loading...", leverage: "Loading...", pnl: "Loading...", symbol: "Loading..." },
  ]);
  const [totalPnL, setTotalPnL] = useState(0);
  const [totalPortfolioValue, setTotalPortfolioValue] = useState(0);

  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const hasInitLoaded = useRef(false);
  const [portfolioHistoryGraphData, setPortfolioHistoryGraphData] = useState(null);
  const [transfers, setTransfers] = useState([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState(null);
  const [orders, setOrders] = useState([]);

  const chartOptions = useChart({
    stroke: { width: 3 },
    grid: {
      padding: {
        top: 20,
        left: 6,
        right: 6,
        bottom: 6,
      },
    },
    chart: {
      toolbar: {
        show: true
      },
      zoom: {
        enabled: true
      },
      margin: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
      }
    },
    xaxis: { categories: portfolioHistoryGraphData?.categories },
  });

  const handlePortfolioChange = useCallback((portfolioId) => {
    setSelectedPortfolioId(portfolioId);
    // Reset all data to loading state
    setTrades([defaultTrade]);
    setBalances([{
      balance_id: 1,
      exchange: "Loading...",
      equity: "Loading...",
      free_collateral: "Loading..."
    }]);
    setTotalPnL(0);
    setTotalPortfolioValue(0);
    setPortfolioHistoryGraphData(null);
    setTransfers([]);
  }, []);

  useEffect(() => {
    if (user && !userLoading && selectedPortfolioId) {
      setIsLoading(true);

      axiosInstance.get(`dashboardData/${selectedPortfolioId}/`)
        .then(response => {
          console.log("Response: ", response);
          setTrades(response.data.trades);
          setBalances(response.data.balances);
          setTotalPnL(response.data.total_pnl);
          setTotalPortfolioValue(response.data.total_portfolio_value);
          setError(null);
        })
        .catch(error => {
          setError(error);
          console.log("Error: ", error);
          error.response?.data?.detail && toast.error(error.response.data.detail);
          setTrades(null);
          setBalances(null);
          setTotalPnL(null);
          setTotalPortfolioValue(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
      axiosInstance.get(`portfolioHistory/${selectedPortfolioId}`)
        .then(response => {
          console.log("Response: ", response);
          setPortfolioHistoryGraphData({
            categories: response.data.portfolio_history.map(row => row.date),
            series: [
              {
                name: 'Avg Portfolio Value',
                data: response.data.portfolio_history.map(row => parseFloat(row.avg_wallet_balance).toFixed(2)),
              }
            ],
          });
          setError(null);
        })
        .catch(error => {
          setError(error);
          console.log("Error: ", error);
          error.response?.data?.detail && toast.error(error.response.data.detail);
          setPortfolioHistoryGraphData(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [user, userLoading, selectedPortfolioId]);

  useEffect(() => {
    if (user && !userLoading && selectedPortfolioId) {
      const fetchOrders = () => {
        axiosInstance.get(`portfolio/${selectedPortfolioId}/orders`)
          .then(response => {
            setOrders(response.data.orders);
          })
          .catch(error => {
            console.error('Error fetching orders:', error);
            toast.error('Failed to fetch order updates');
          });
      };

      fetchOrders();
      const intervalId = setInterval(fetchOrders, 30000);

      return () => {
        clearInterval(intervalId);
      };
    }
  }, [user, userLoading, selectedPortfolioId]);

  const theme = useTheme();

  const POSITIONS_TABLE_HEAD = [
    { id: 'exchange', label: 'Exchange' },
    { id: 'symbol', label: 'Market/Symbol' },
    { id: 'size', label: 'Size' },
    { id: 'side', label: 'Side' },
    { id: 'entry_price', label: 'Entry Price' },
    { id: 'current_price', label: 'Current Price' },
    { id: 'liquidation_price', label: 'Liquidation Price' },
    { id: 'exit_price', label: 'Exit Price' },
    { id: 'leverage', label: 'Leverage' },
    { id: 'pnl', label: 'PnL' },
    { id: 'cum_funding', label: 'Cumm. Funding' },
  ];


  const BALANCES_TABLE_HEAD = [
    { id: 'exchange', label: 'Exchange' },
    { id: 'equity', label: 'Equity' },
    { id: 'free_collateral', label: 'Free Collateral' },
    { id: 'balance_eth', label: 'ETH Balance' }
  ];

  useEffect(() => {
    if (user && !userLoading && selectedPortfolioId) {
      console.log("Selected Portfolio ID: ", selectedPortfolioId);

      const fetchTransfers = () => {
        axiosInstance.get(`portfolio/${selectedPortfolioId}/transfers`)
          .then(response => {
            setTransfers(response.data.transfers);
          })
          .catch(error => {
            console.error('Error fetching transfers:', error);
            toast.error('Failed to fetch transfer updates');
          });
      };

      // Initial fetch
      fetchTransfers();

      // Set up interval for fetching every 30 seconds
      const intervalId = setInterval(fetchTransfers, 30000);

      // Clean up function
      return () => {
        clearInterval(intervalId);
      };
    }
  }, [user, userLoading, selectedPortfolioId]);

  const TransferRow = ({ transfer }) => {
    const [open, setOpen] = useState(false);

    return (
      <>
        <TableRow>
          <TableCell>
            <IconButton
              aria-label="expand row"
              size="small"
              onClick={() => setOpen(!open)}
            >
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          </TableCell>
          <TableCell>{transfer.transfer_id}</TableCell>
          <TableCell>{transfer.from_exchange}</TableCell>
          <TableCell>{transfer.to_exchange}</TableCell>
          <TableCell>{transfer.amount}</TableCell>
          <TableCell>{transfer.total_fees.toFixed(5)} ({((transfer.total_fees / transfer.amount) * 100).toFixed(2)}%)</TableCell>
          <TableCell>{transfer.transfer_state}</TableCell>
          <TableCell>{new Date(transfer.initiated_at).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(/(\d+)\/(\d+)\/(\d+),/, '$3-$1-$2')}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box sx={{ margin: 1 }}>
                <Typography variant="h6" gutterBottom component="div">
                  Transfer Details
                </Typography>
                <Table size="small" aria-label="purchases">
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" scope="row">Position ID</TableCell>
                      <TableCell>{transfer.position_id}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Completed At</TableCell>
                      <TableCell>{transfer.completed_at ? new Date(transfer.completed_at).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(/(\d+)\/(\d+)\/(\d+),/, '$3-$1-$2') : '-'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Transfer Duration</TableCell>
                      <TableCell>
                        {transfer.initiated_at && transfer.completed_at ? (
                          (() => {
                            const initiated = new Date(transfer.initiated_at);
                            const completed = new Date(transfer.completed_at);
                            const durationMs = completed - initiated;
                            const durationMinutes = Math.floor(durationMs / 60000);
                            const durationSeconds = ((durationMs % 60000) / 1000).toFixed(0);
                            return `${durationMinutes} minutes ${durationSeconds} seconds`;
                          })()
                        ) : 'N/A'}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <Typography variant="h6" gutterBottom component="div" sx={{ mt: 2 }}>
                  Transfer Logs
                </Typography>
                <Table size="small" aria-label="transfer logs">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date Created</TableCell>
                      <TableCell>New Transfer State</TableCell>
                      <TableCell>Log Details</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transfer.transfer_logs.map((log) => (
                      <TableRow key={log.update_id}>
                        <TableCell>{new Date(log.date_created).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(/(\d+)\/(\d+)\/(\d+),/, '$3-$1-$2')}</TableCell>
                        <TableCell>{log.new_transfer_state}</TableCell>
                        <TableCell>{log.log_details}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      </>
    );
  };

  const OrderRow = ({ order }) => {
    const [open, setOpen] = useState(false);

    return (
      <>
        <TableRow>
          <TableCell>
            <IconButton
              aria-label="expand row"
              size="small"
              onClick={() => setOpen(!open)}
            >
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          </TableCell>
          <TableCell>{order.order_id}</TableCell>
          <TableCell>{order.exchange}</TableCell>
          <TableCell>{order.symbol}</TableCell>
          <TableCell>{order.side}</TableCell>
          <TableCell>{order.size}</TableCell>
          <TableCell>{order.price}</TableCell>
          <TableCell>{order.order_status}</TableCell>
          <TableCell>{new Date(order.timestamp).toLocaleString()}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box sx={{ margin: 1 }}>
                <Typography variant="h6" gutterBottom component="div">
                  Order Details
                </Typography>
                <Table size="small" aria-label="order-details">
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" scope="row">Position ID</TableCell>
                      <TableCell>{order.position_id}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Order Type</TableCell>
                      <TableCell>{order.order_type}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Filled Size</TableCell>
                      <TableCell>{order.filled_size}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <Typography variant="h6" gutterBottom component="div" sx={{ mt: 2 }}>
                  Order Updates
                </Typography>
                <Table size="small" aria-label="order-updates">
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Details</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {order.order_updates?.map((update, index) => (
                      <TableRow key={index}>
                        <TableCell>{new Date(update.timestamp).toLocaleString()}</TableCell>
                        <TableCell>{update.status}</TableCell>
                        <TableCell>{update.details}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      </>
    );
  };

  return (
    <DashboardContent maxWidth="xl">
      <Grid container spacing={3}>
        {/* First column */}
        <Grid item xs={12} md={6}>
          <AppWelcome
            title={`Welcome back 👋 \n ${user?.name}`}
            description="May the funding rate spreads be wide and the market books deep."
          />
        </Grid>

        {/* Second column */}
        <Grid item xs={12} md={6}>
          {/* PortfolioOverview spanning the full width of the second column */}
          <Grid item xs={12} sm={12}>
            <PortfolioOverview onPortfolioChange={handlePortfolioChange} />
          </Grid>

          {/* Grid container for the AppWidgetSummary components */}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <AppWidgetSummary
                title="Portfolio Value"
                total={totalPortfolioValue}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <AppWidgetSummary
                width="100%"
                title="Total P&L"
                total={totalPnL}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      {selectedPortfolioId && (
        <Grid xs={12} lg={12}>
          <h2>Last 5 Transfers</h2>
          <TableContainer component={Paper} sx={{ maxWidth: '100%', overflowX: 'auto' }}>
            <Table sx={{ minWidth: 400 }}>
              <TableHeadCustom headLabel={[
                { id: 'expand', label: '' },
                ...TRANSFERS_TABLE_HEAD
              ]} />
              <TableBody>
                {transfers.length > 0 ? (
                  transfers.map((transfer) => (
                    <TransferRow key={transfer.transfer_id} transfer={transfer} />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center">No transfers available</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      )}
      {selectedPortfolioId && (
        <Grid xs={12} lg={12}>
          <h2>Last 5 Orders</h2>
          <TableContainer component={Paper} sx={{ maxWidth: '100%', overflowX: 'auto' }}>
            <Table sx={{ minWidth: 400 }}>
              <TableHeadCustom headLabel={[
                { id: 'expand', label: '' },
                ...ORDERS_TABLE_HEAD
              ]} />
              <TableBody>
                {orders.length > 0 ? (
                  orders.map((order) => (
                    <OrderRow key={order.order_id} order={order} />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} align="center">No orders available</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      )}
      {portfolioHistoryGraphData?.series ? (
        <Grid xs={12} md={12} lg={12} sx={{ mt: 4 }}>
          <Chart type="line" series={portfolioHistoryGraphData?.series} options={chartOptions} height={400} />
        </Grid>
      ) : (
        <Grid xs={12} md={12} lg={12} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400, mt: 4 }}>
          <Typography variant="h6">Loading History...</Typography>
        </Grid>
      )}

      <Grid xs={12} lg={12}>
        <h2>Trades</h2>
        <TableContainer component={Paper} sx={{ maxWidth: '100%', overflowX: 'auto' }}>
          <Table sx={{ minWidth: 400 }}>
            <TableHeadCustom headLabel={POSITIONS_TABLE_HEAD} />

            <TableBody>
              {trades?.map((row) => (
                <TableRow key={row.balance_id}>
                  <TableCell>{row.exchange}</TableCell>
                  <TableCell>{row.symbol}</TableCell>
                  <TableCell>{row.size}</TableCell>
                  <TableCell>{row.side}</TableCell>
                  <TableCell>{row.entry_price}</TableCell>
                  <TableCell>{row.current_price}</TableCell>
                  <TableCell>{row.liquidation_price}</TableCell>
                  <TableCell>{row.exit_price}</TableCell>
                  <TableCell>{row.leverage}</TableCell>
                  <TableCell>{row.pnl}</TableCell>
                  <TableCell>{row.cum_funding}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>

      <Grid xs={12} lg={12}>
        <h2>Balances</h2>
        <TableContainer component={Paper} sx={{ maxWidth: '100%', overflowX: 'auto' }}>
          <Table sx={{ minWidth: 400 }}>
            <TableHeadCustom headLabel={BALANCES_TABLE_HEAD} />

            <TableBody>
              {balances?.map((row) => (
                <TableRow key={row.balance_id}>
                  <TableCell>{row.exchange}</TableCell>
                  <TableCell>{row.equity}</TableCell>
                  <TableCell>{row.free_collateral}</TableCell>
                  <TableCell>{row.balance_eth}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </DashboardContent>
  );
}
