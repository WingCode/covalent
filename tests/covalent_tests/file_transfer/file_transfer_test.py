# Copyright 2021 Agnostiq Inc.
#
# This file is part of Covalent.
#
# Licensed under the GNU Affero General Public License 3.0 (the "License").
# A copy of the License may be obtained with this software package or at
#
#      https://www.gnu.org/licenses/agpl-3.0.en.html
#
# Use of this file is prohibited except in compliance with the License. Any
# modifications or derivative works of this file must retain this copyright
# notice, and modified files must contain a notice indicating that they have
# been altered from the originals.
#
# Covalent is distributed in the hope that it will be useful, but WITHOUT
# ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
# FITNESS FOR A PARTICULAR PURPOSE. See the License for more details.
#
# Relief from the License may be granted by purchasing a commercial license.

from unittest.mock import Mock

import pytest

from covalent._file_transfer import File
from covalent._file_transfer.enums import Order
from covalent._file_transfer.file_transfer import (
    FileTransfer,
    TransferFromRemote,
    TransferToRemote,
)
from covalent._file_transfer.strategies.rsync_strategy import Rsync


class TestFileTransfer:
    def test_raise_exception_valid_args(self):
        # valid filepaths should not raise errors
        FileTransfer("file:///home/one.csv", "file:///home/one.csv")
        FileTransfer("file:///home/one.csv", None)
        FileTransfer(None, "file:///home/one.csv")
        FileTransfer(None, None)
        FileTransfer(File("file:///home/one.csv"), "file:///home/one.csv")
        FileTransfer("file:///home/one.csv", File("file:///home/one.csv"))
        FileTransfer(File("file:///home/one.csv"), File("file:///home/one.csv"))

    @pytest.mark.parametrize(
        "is_from_file_remote, is_to_file_remote",
        [
            (False, False),
            (True, False),
            (False, True),
        ],
    )
    def test_upload_download_cp(self, is_from_file_remote, is_to_file_remote):
        from_file = File("file:///home/source.csv", is_remote=is_from_file_remote)
        to_file = File("file:///home/dest.csv", is_remote=is_to_file_remote)

        mock_strategy = Mock()

        ft = FileTransfer(from_file, to_file, strategy=mock_strategy)

        ft.cp()

        if not is_to_file_remote and not is_from_file_remote:
            mock_strategy.cp.assert_called_once()
        elif is_from_file_remote and not is_to_file_remote:
            mock_strategy.download.assert_called_once()
        elif not is_from_file_remote and is_to_file_remote:
            mock_strategy.upload.assert_called_once()

    def test_transfer_from_remote(self):
        strategy = Rsync()
        result = TransferFromRemote(
            "file:///home/one.csv", "file:///home/one.csv", strategy=strategy
        )
        assert result.from_file.is_remote
        assert not result.from_file.is_dir
        assert not result.to_file.is_remote
        assert not result.to_file.is_dir
        assert result.order == Order.BEFORE
        assert result.strategy == strategy

        result = TransferFromRemote("file:///home/one/", "file:///home/one/", strategy=strategy)
        assert result.from_file.is_remote
        assert result.from_file.is_dir
        assert not result.to_file.is_remote
        assert result.to_file.is_dir
        assert result.order == Order.BEFORE
        assert result.strategy == strategy

        with pytest.raises(ValueError):
            result = TransferFromRemote("file:///home/one/", "file:///home/one", strategy=strategy)

    def test_transfer_to_remote(self):
        strategy = Rsync()
        result = TransferToRemote(
            "file:///home/one.csv", "file:///home/one.csv", strategy=strategy
        )
        assert not result.from_file.is_remote
        assert not result.from_file.is_dir
        assert result.to_file.is_remote
        assert not result.to_file.is_dir
        assert result.order == Order.AFTER
        assert result.strategy == strategy

        result = TransferToRemote("file:///home/one/", "file:///home/one/", strategy=strategy)
        assert not result.from_file.is_remote
        assert result.from_file.is_dir
        assert result.to_file.is_remote
        assert result.to_file.is_dir
        assert result.order == Order.AFTER
        assert result.strategy == strategy

        with pytest.raises(ValueError):
            result = TransferToRemote("file:///home/one", "file:///home/one/", strategy=strategy)
