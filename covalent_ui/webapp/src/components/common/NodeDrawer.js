/**
 * Copyright 2021 Agnostiq Inc.
 *
 * This file is part of Covalent.
 *
 * Licensed under the GNU Affero General Public License 3.0 (the "License").
 * A copy of the License may be obtained with this software package or at
 *
 *      https://www.gnu.org/licenses/agpl-3.0.en.html
 *
 * Use of this file is prohibited except in compliance with the License. Any
 * modifications or derivative works of this file must retain this copyright
 * notice, and modified files must contain a notice indicating that they have
 * been altered from the originals.
 *
 * Covalent is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE. See the License for more details.
 *
 * Relief from the License may be granted by purchasing a commercial license.
 */

import _ from 'lodash'
import React, { useEffect } from 'react'
import { Close } from '@mui/icons-material'
import { useStoreActions } from 'react-flow-renderer'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box,
  Divider,
  Drawer,
  IconButton,
  Paper,
  Typography,
  Skeleton,
} from '@mui/material'
import { alpha } from '@mui/material/styles'

import {
  formatDate,
  statusColor,
  statusIcon,
  statusLabel,
  getLocalStartTime,
} from '../../utils/misc'
import Runtime from '../dispatches/Runtime'
import SyntaxHighlighter from './SyntaxHighlighter'
import Heading from '../common/Heading'
import ErrorCard from './ErrorCard'
import InputSection from './InputSection'
import ResultSection from './ResultSection'
import ExecutorSection from './ExecutorSection'
import {
  electronDetails,
  electronResult,
  electronExecutor,
  electronFunctionString,
  electronError,
  electronInput,
} from '../../redux/electronSlice'
import { Prettify } from '../../utils/misc'

export const nodeDrawerWidth = 360

const NodeDrawer = ({ node, dispatchId, prettify }) => {
  const dispatch = useDispatch()
  const electronId = node !== undefined && node.node_id
  const electronDetail = useSelector(
    (state) => state.electronResults.electronList
  )
  const electronInputResult = useSelector(
    (state) => state.electronResults.electronInput
  )
  const electronResultData = useSelector(
    (state) => state.electronResults.electronResult
  )
  const electronExecutorResult = useSelector(
    (state) => state.electronResults.electronExecutor
  )
  const electronFunctionResult = useSelector(
    (state) => state.electronResults.electronFunctionString
  )
  const electronErrorData = useSelector(
    (state) => state.electronResults.electronError
  )
  const electronDetailIsFetching = useSelector(
    (state) => state.electronResults.electronDetailsList.isFetching
  )
  const electronInputResultIsFetching = useSelector(
    (state) => state.electronResults.electronInputList.isFetching
  )
  const electronResultDataIsFetching = useSelector(
    (state) => state.electronResults.electronResultList.isFetching
  )
  const electronExecutorResultIsFetching = useSelector(
    (state) => state.electronResults.electronExecutorList.isFetching
  )
  const electronFunctionResultIsFetching = useSelector(
    (state) => state.electronResults.electronFunctionStringList.isFetching
  )
  const callSocketApi = useSelector((state) => state.common.callSocketApi)

  useEffect(() => {
    if (!!node) {
      dispatch(electronDetails({ electronId, dispatchId }))
      dispatch(electronInput({ dispatchId, electronId, params: 'inputs' }))
      dispatch(electronResult({ dispatchId, electronId, params: 'result' }))
      dispatch(electronExecutor({ dispatchId, electronId, params: 'executor' }))
      dispatch(
        electronFunctionString({
          dispatchId,
          electronId,
          params: 'function_string',
        })
      )
      dispatch(electronError({ dispatchId, electronId, params: 'error' }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node, callSocketApi])

  const setSelectedElements = useStoreActions(
    (actions) => actions.setSelectedElements
  )

  const handleClose = () => {
    setSelectedElements([])
  }

  const nodeLabel = (type, name) => {
    switch (type) {
      case 'parameter':
        return name?.replace(':parameter:', '')
      case 'electron_list':
        return name?.replace(':electron_list:', 'electron list')
      case 'sublattice':
        return name?.replace(':sublattice:', 'Sublattice:')
      default:
        return name
    }
  }

  const hasStarted = !!_.get(electronDetail, 'started_at')
  const hasEnded = !!_.get(electronDetail, 'ended_at')

  return (
    <Drawer
      sx={(theme) => ({
        width: nodeDrawerWidth,
        '& .MuiDrawer-paper': {
          width: nodeDrawerWidth,
          boxSizing: 'border-box',
          border: 'none',
          p: 3,
          marginRight: '10px',
          marginTop: '22px',
          height: '95vh',
          bgcolor: alpha(theme.palette.background.default),
          boxShadow: '0px 16px 50px rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(8px)',
          borderRadius: '16px',
          '@media (max-width: 1290px)': {
            height: '92vh',
            marginTop: '70px',
          },
        },
      })}
      anchor="right"
      variant="persistent"
      open={!!node}
      onClose={handleClose}
      data-testid="nodeDrawer"
    >
      {!!node && (
        <>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            {!electronDetail && electronDetailIsFetching ? (
              <Skeleton data-testid="node__box_skl" width={150} />
            ) : (
              <Typography sx={{ color: '#A5A6F6', overflowWrap: 'anywhere' }}>
                {prettify
                  ? Prettify(electronDetail?.name, electronDetail?.type || '')
                  : nodeLabel(electronDetail?.type, electronDetail?.name)}
              </Typography>
            )}

            <Box data-testid="node__dra_close">
              <IconButton onClick={handleClose}>
                <Close />
              </IconButton>
            </Box>
          </Box>

          {/* Status */}
          {electronDetail.status && (
            <>
              <Heading>Status</Heading>
              {!electronDetail && electronDetailIsFetching ? (
                <Skeleton data-testid="node__status_skl" width={150} />
              ) : (
                <Box
                  sx={{
                    mt: 1,
                    mb: 2,
                    color: statusColor(electronDetail.status),
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {statusIcon(electronDetail.status)}
                  &nbsp;
                  {statusLabel(electronDetail.status)}
                </Box>
              )}
            </>
          )}

          {electronErrorData && <ErrorCard error={electronErrorData.data} />}

          {/* Description */}
          {electronDetail.description &&
            (!electronDetail && electronDetailIsFetching ? (
              <Skeleton data-testid="node__desc_skl" />
            ) : (
              <>
                <Heading>Description</Heading>
                <Typography fontSize="body2.fontSize" color="text.tertiary">
                  {electronDetail.description}
                </Typography>
              </>
            ))}

          {/* Start/end times */}

          {hasStarted && (
            <>
              <Heading>Started{hasEnded ? ' - Ended' : ''}</Heading>
              {!electronDetail && electronDetailIsFetching ? (
                <Skeleton data-testid="node__start_time" />
              ) : (
                <Typography fontSize="body2.fontSize" color="text.tertiary">
                  {formatDate(getLocalStartTime(electronDetail.started_at))}
                  {hasEnded &&
                    ` - ${formatDate(
                      getLocalStartTime(electronDetail.ended_at)
                    )}`}
                </Typography>
              )}
            </>
          )}

          {/* Runtime */}

          {electronDetail.status && electronDetail.status !== 'NEW_OBJECT' && (
            <>
              <Heading>Runtime</Heading>
              {!electronDetail && electronDetailIsFetching ? (
                <Skeleton data-testid="node__run_skeleton" />
              ) : (
                <Runtime
                  sx={(theme) => ({
                    color: theme.palette.text.tertiary,
                    fontSize: 'body2.fontSize',
                  })}
                  startTime={electronDetail.started_at}
                  endTime={electronDetail.ended_at}
                />
              )}
            </>
          )}

          {/* Input */}
          {electronInputResult && (
            <InputSection
              inputs={electronInputResult}
              data-testid="node__input_sec"
              sx={(theme) => ({
                bgcolor: theme.palette.background.outRunBg,
                cursor: 'pointer',
              })}
              isFetching={!electronInputResult && electronInputResultIsFetching}
            />
          )}

          {/* Result */}
          {electronDetail.status === 'COMPLETED' && (
            <ResultSection
              results={electronResultData}
              data-testid="node__result_sec"
              sx={(theme) => ({
                bgcolor: theme.palette.background.outRunBg,
                cursor: 'pointer',
              })}
              isFetching={!electronResultData && electronResultDataIsFetching}
            />
          )}

          {/* Executor */}
          {electronExecutorResult && (
            <ExecutorSection
              metadata={electronExecutorResult}
              sx={(theme) => ({
                bgcolor: theme.palette.background.outRunBg,
              })}
              isFetching={
                !electronExecutorResult && electronExecutorResultIsFetching
              }
            />
          )}

          <Divider sx={{ my: 2 }} />

          {/* Source */}

          {!electronFunctionResult && electronFunctionResultIsFetching ? (
            <Skeleton sx={{ height: '100px' }} />
          ) : (
            <>
              <Heading />
              <Paper
                elevation={0}
                sx={(theme) => ({
                  bgcolor: theme.palette.background.outRunBg,
                })}
              >
                <SyntaxHighlighter src={electronFunctionResult.data} />
              </Paper>
            </>
          )}
        </>
      )}
    </Drawer>
  )
}

export default NodeDrawer
